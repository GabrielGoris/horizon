import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import type { CoverFieldProps } from "../../types";

type AssetSourceControlProps = {
  error?: import("react-hook-form").FieldError;
  input: CoverFieldProps["coverInput"] | CoverFieldProps["backdropInput"];
  inputClass: string;
  isUploading: boolean;
  kind: "cover" | "backdrop";
  label: string;
  onClear: (kind: "cover" | "backdrop") => void;
  onUpload: CoverFieldProps["onUpload"];
  value?: string;
};

function AssetSourceControl({ error, input, inputClass, isUploading, kind, label, onClear, onUpload, value }: AssetSourceControlProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [sourceMode, setSourceMode] = useState<"gallery" | "link" | null>(null);
  const activeSourceMode = sourceMode ?? (value ? "link" : null);

  const handleLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSourceMode(event.target.value.trim() ? "link" : null);
    void input.onChange(event);
  };

  return (
    <div className="relative min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-500">{label}</span>
        {value && <button type="button" onClick={() => { setSourceMode(null); onClear(kind); }} aria-label={`Remover ${label.toLowerCase()}`} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-neutral-300 transition hover:text-red-300"><X size={13} /></button>}
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={activeSourceMode === "link" || isUploading} onClick={() => pickerRef.current?.click()} className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-noir-gold/25 bg-noir-gold/10 px-3 text-[9px] font-bold uppercase tracking-wider text-noir-champagne transition hover:bg-noir-gold/15 disabled:cursor-not-allowed disabled:opacity-45">
          {isUploading && activeSourceMode === "gallery" ? <LoaderCircle size={13} className="animate-spin" /> : <ImagePlus size={13} />} Galeria
        </button>
        <input placeholder="ou cole um link" {...input} onChange={handleLinkChange} disabled={activeSourceMode === "gallery" || isUploading} className={`${inputClass} min-w-0 flex-1 px-3 py-2 text-xs ${error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""} disabled:cursor-not-allowed disabled:opacity-45`} />
      </div>
      <input ref={pickerRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) {
          setSourceMode("gallery");
          void Promise.resolve(onUpload(file, kind)).catch(() => setSourceMode(null));
        }
        event.currentTarget.value = "";
      }} />
    </div>
  );
}

export function CoverField({
  backdropError,
  backdropInput,
  backdropValue,
  coverError,
  coverInput,
  coverLabel,
  coverValue,
  errorClass,
  inputClass,
  isUploading = false,
  labelClass,
  onClear,
  onUpload,
}: CoverFieldProps) {
  const previewBackground = backdropValue || coverValue;

  return (
    <div className={labelClass}>
      <span>{coverLabel}</span>
      <div className="relative min-h-[205px] overflow-hidden rounded-xl border border-white/10 bg-[#111114] p-4">
        {previewBackground && <><img src={previewBackground} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-45 blur-sm" /><div className="absolute inset-0 bg-[#111114]/55" /></>}
        <div className="relative flex gap-4">
          <div className="flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-center text-[9px] text-neutral-500 shadow-2xl shadow-black/45">
            {coverValue ? <img src={coverValue} alt="Capa selecionada" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2"><ImagePlus size={18} /> Sem capa</span>}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
            <AssetSourceControl label="Capa" kind="cover" value={coverValue} input={coverInput} error={coverError} inputClass={inputClass} isUploading={isUploading} onClear={onClear} onUpload={onUpload} />
            <AssetSourceControl label="Imagem de fundo" kind="backdrop" value={backdropValue} input={backdropInput} error={backdropError} inputClass={inputClass} isUploading={isUploading} onClear={onClear} onUpload={onUpload} />
          </div>
        </div>
      </div>
      {(coverError || backdropError) && <span className={errorClass}>{coverError?.message ?? backdropError?.message}</span>}
    </div>
  );
}
