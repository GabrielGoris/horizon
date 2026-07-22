import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";

export type HorizonSelectOption = {
  label: string;
  value: string;
};

interface HorizonSelectProps {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  options: HorizonSelectOption[];
  value: string;
}

export function HorizonSelect({ ariaLabel, className = "", onChange, options, value }: HorizonSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectId = useId();
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const closeWhenAnotherSelectOpens = (event: Event) => {
      const openingSelectId = (event as CustomEvent<string>).detail;

      if (openingSelectId !== selectId) setIsOpen(false);
    };

    window.addEventListener("horizon:select-open", closeWhenAnotherSelectOpens);
    return () => window.removeEventListener("horizon:select-open", closeWhenAnotherSelectOpens);
  }, [selectId]);

  const toggle = () => {
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent("horizon:select-open", { detail: selectId }));
    }

    setIsOpen((current) => !current);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-[#131315] px-3 py-2 text-left text-sm outline-none transition-all ${
          isOpen ? "border-noir-gold ring-1 ring-noir-gold" : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className="min-w-0 truncate text-white">{selectedOption?.label ?? "Selecione uma opção"}</span>
        <ChevronDown aria-hidden="true" size={15} className={`shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div role="listbox" aria-label={ariaLabel} className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[90] max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#17171a] p-1.5 shadow-2xl shadow-black/50">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                aria-selected={isSelected}
                role="option"
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-noir-gold/15 text-noir-gold"
                    : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
