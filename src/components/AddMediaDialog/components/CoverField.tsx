import type { ChangeEvent } from "react";
import type { CoverFieldProps } from "../types";

export function CoverField({
  className,
  coverBackground,
  coverFallback,
  coverInput,
  coverLabel,
  coverValue,
  error,
  errorClass,
  inputClass,
  labelClass,
  onUseCoverFallback,
}: CoverFieldProps) {
  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    void coverInput.onChange(event);
  };

  return (
    <label className={`${labelClass} ${className ?? ""}`}>
      {coverLabel}
      <div className="relative flex min-h-[170px] flex-1 items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-[#111114] p-4">
        {coverBackground && (
          <>
            <img
              src={coverBackground}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-60 blur-sm"
            />
            <div className="absolute inset-0 bg-[#111114]/48" />
          </>
        )}

        <div className="relative flex h-36 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-center text-[10px] leading-4 text-neutral-500 shadow-2xl shadow-black/35">
          {coverValue ? (
            <img
              src={coverValue}
              alt="Capa selecionada"
              onError={(event) => {
                if (coverFallback && event.currentTarget.src !== coverFallback) {
                  event.currentTarget.src = coverFallback;
                  onUseCoverFallback?.(coverFallback);
                  return;
                }

                event.currentTarget.remove();
              }}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>Sem capa</span>
          )}
        </div>
        <div className="relative min-w-0 flex-1">
          <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-neutral-500">
            Trocar URL da capa
          </span>
          <input
            placeholder="https://..."
            {...coverInput}
            onChange={handleCoverChange}
            className={`${inputClass} ${error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
        </div>
      </div>
      {error && <span className={errorClass}>{error.message}</span>}
    </label>
  );
}
