import { typeOptions } from "../consts";
import type { MediaTypePickerProps } from "../types";

export function MediaTypePicker({ onSelect }: MediaTypePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {typeOptions.map((option) => {
        const Icon = option.icon;

        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            className="rounded-xl border border-white/10 bg-white/[0.025] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-noir-gold/35 hover:bg-white/[0.045]"
          >
            <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-noir-gold/10 text-noir-gold">
              <Icon size={19} />
            </span>
            <strong className="block font-serif text-xl text-white">
              {option.title}
            </strong>
            <span className="mt-2 block text-xs leading-5 text-neutral-500">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
