import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CustomCategoryIcon } from "../CustomCategoryIcon";
import { CUSTOM_CATEGORY_ICONS } from "../CustomCategoryIcon/consts";

interface CustomCategoryIconSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomCategoryIconSelect({ onChange, value }: CustomCategoryIconSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = CUSTOM_CATEGORY_ICONS.find((option) => option.value === value) ?? CUSTOM_CATEGORY_ICONS[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative normal-case tracking-normal">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        className="flex h-11 w-full items-center gap-3 rounded-lg border border-white/10 bg-[#111114] px-3 text-left text-sm font-semibold text-white outline-none transition hover:border-white/20 focus:border-noir-gold/70"
      >
        <CustomCategoryIcon name={selected.value} size={17} className="shrink-0 text-noir-gold" />
        <span className="flex-1">{selected.label}</span>
        <ChevronDown size={15} className={`text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Ícone da categoria"
          className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-white/15 bg-[#111114] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.6)]"
        >
          {CUSTOM_CATEGORY_ICONS.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-noir-gold/12 text-noir-champagne"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <CustomCategoryIcon
                  name={option.value}
                  size={16}
                  className={isSelected ? "text-noir-gold" : "text-neutral-500"}
                />
                <span className="flex-1">{option.label}</span>
                {isSelected && <Check size={14} className="text-noir-gold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
