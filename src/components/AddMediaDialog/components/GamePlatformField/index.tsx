import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { GamePlatformLogo } from "../../../GamePlatformLogo";
import { GAME_PLATFORM_OPTIONS, getGamePlatformOption } from "../../../../consts/gamePlatforms";
import type { GamePlatformFieldProps } from "../types";

export function GamePlatformField({ metaValue, onChange, setValue }: GamePlatformFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedPlatform = getGamePlatformOption(metaValue);
  const inputValue = isOpen ? searchTerm : selectedPlatform?.label ?? metaValue ?? "";
  const filteredPlatforms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return GAME_PLATFORM_OPTIONS;

    return GAME_PLATFORM_OPTIONS.filter((platform) => {
      const matchesLabel = platform.label.toLowerCase().includes(normalizedSearch);
      const matchesAlias = platform.aliases.some((alias) => alias.includes(normalizedSearch));

      return matchesLabel || matchesAlias;
    });
  }, [searchTerm]);

  const selectPlatform = (label: string) => {
    if (onChange) {
      onChange(label);
    } else if (setValue) {
      setValue("meta", label, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
        Plataforma principal
      </span>

      <div className="relative">
        <label className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-[#131315] px-4 py-3 transition-all ${
          isOpen ? "border-noir-gold ring-1 ring-noir-gold" : "border-white/10"
        }`}>
          {selectedPlatform && !isOpen && (
            <GamePlatformLogo platform={selectedPlatform} className="h-6 w-9 shrink-0 text-[#ebdcb9]" />
          )}
          <input
            aria-label="Plataforma principal"
            value={inputValue}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setSearchTerm("");
              setIsOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setIsOpen(false), 120);
            }}
            placeholder="Digite ou escolha uma plataforma..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white placeholder-neutral-600 outline-none"
          />
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </label>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#151519] p-2 shadow-2xl">
            {filteredPlatforms.length ? (
              <div className="flex flex-col gap-1">
                {filteredPlatforms.map((platform) => {
                  const isSelected = selectedPlatform?.label === platform.label;

                  return (
                    <button
                      key={platform.label}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectPlatform(platform.label)}
                      className={`flex items-center gap-4 rounded-lg border px-3 py-2.5 text-left transition-all ${
                        isSelected
                          ? "border-noir-gold bg-noir-gold/15 text-[#ebdcb9]"
                          : "border-transparent text-neutral-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md bg-black/30 text-[#ebdcb9]">
                        <GamePlatformLogo platform={platform} className="h-8 w-12" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-white">
                          {platform.label}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                          {platform.aliases.slice(0, 3).join(" / ")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-neutral-500">
                Nenhuma plataforma encontrada.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
