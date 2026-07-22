import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GAME_PLATFORM_OPTIONS, getGamePlatformOption } from "../../consts/gamePlatforms";
import { GamePlatformLogo } from "../GamePlatformLogo";

type GamePlatformSelectProps = {
  ariaLabel?: string;
  onChange: (value: string) => void;
  value: string;
};

export function GamePlatformSelect({
  ariaLabel = "Plataforma principal",
  onChange,
  value,
}: GamePlatformSelectProps) {
  const selectId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 16, top: 16, width: 220 });
  const selectedPlatform = getGamePlatformOption(value);

  useEffect(() => {
    const closeWhenAnotherSelectOpens = (event: Event) => {
      const openingSelectId = (event as CustomEvent<string>).detail;

      if (openingSelectId !== selectId) setIsOpen(false);
    };

    window.addEventListener("horizon:select-open", closeWhenAnotherSelectOpens);
    return () => window.removeEventListener("horizon:select-open", closeWhenAnotherSelectOpens);
  }, [selectId]);

  useEffect(() => {
    if (!isOpen) return;

    const closeMenu = (event: PointerEvent) => {
      if (triggerRef.current?.contains(event.target as Node) || menuRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const closeOnViewportChange = () => setIsOpen(false);

    document.addEventListener("pointerdown", closeMenu);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (!isOpen) {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (rect) {
        const width = Math.min(248, Math.max(200, rect.width));
        setMenuPosition({
          left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
          top: rect.bottom + 8,
          width,
        });
      }

      window.dispatchEvent(new CustomEvent("horizon:select-open", { detail: selectId }));
    }

    setIsOpen((current) => !current);
  };

  return (
    <div className="min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={toggleMenu}
        className="flex h-6 w-full min-w-0 items-center justify-between gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 font-mono text-[10px] leading-none text-neutral-400 transition-colors hover:border-noir-gold/35 hover:text-noir-champagne"
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selectedPlatform && <GamePlatformLogo platform={selectedPlatform} className="h-3.5 w-5 shrink-0 text-[#ebdcb9]" />}
          <span className="truncate">{selectedPlatform?.label ?? "Plataforma"}</span>
        </span>
        <ChevronDown size={10} className={`shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel}
          className="fixed z-[100] max-h-[min(18rem,calc(100dvh-2rem))] overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1e] p-1.5 shadow-2xl shadow-black/70"
          style={menuPosition}
        >
          {GAME_PLATFORM_OPTIONS.map((platform) => {
            const isSelected = selectedPlatform?.label === platform.label;

            return (
              <button
                key={platform.label}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  onChange(platform.label);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "bg-noir-gold/15 text-noir-champagne"
                    : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded bg-black/30 text-[#ebdcb9]">
                  <GamePlatformLogo platform={platform} className="h-5 w-7" />
                </span>
                <span className="truncate text-sm font-semibold">{platform.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
