import type { CustomCategoryField, CustomFieldValue } from "../../types/customLibrary";

interface CustomFieldInputProps {
  field: CustomCategoryField;
  value: CustomFieldValue;
  onChange: (value: CustomFieldValue) => void;
  variant?: "default" | "dossier";
}

export function CustomFieldInput({ field, value, onChange, variant = "default" }: CustomFieldInputProps) {
  const isDossier = variant === "dossier";
  const inputClass = isDossier
    ? "h-10 w-full border-x-0 border-b border-t-0 border-white/10 bg-transparent px-0 text-sm text-white outline-none transition focus:border-noir-gold/70"
    : "h-11 w-full rounded-lg border border-white/10 bg-[#111114] px-3 text-sm text-white outline-none transition focus:border-noir-gold/70";
  const labelClass = "flex flex-col gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500";
  const stringValue = typeof value === "string" || typeof value === "number" ? String(value) : "";

  if (field.field_type === "textarea") {
    return (
      <label className={`${labelClass} md:col-span-2`}>
        {field.label}{field.required ? " *" : ""}
        <textarea className={isDossier ? "min-h-20 resize-none border-x-0 border-b border-t-0 border-white/10 bg-transparent px-0 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-noir-gold/70" : "min-h-24 rounded-lg border border-white/10 bg-[#111114] p-3 text-sm normal-case tracking-normal text-white outline-none focus:border-noir-gold/70"} value={stringValue} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  if (field.field_type === "boolean") {
    return (
      <label className={`flex h-11 items-center gap-3 self-end text-sm text-neutral-300 ${isDossier ? "border-b border-white/10 px-0" : "rounded-lg border border-white/10 bg-[#111114] px-4"}`}>
        <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="accent-[#d4af37]" />
        {field.label}
      </label>
    );
  }

  if (field.field_type === "select") {
    return (
      <label className={labelClass}>
        {field.label}{field.required ? " *" : ""}
        <select className={inputClass} value={stringValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">Selecione</option>
          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }

  if (field.field_type === "multiselect") {
    const selectedOptions = Array.isArray(value) ? value : [];

    return (
      <fieldset className={isDossier ? "border-b border-white/10 px-0 py-3" : "rounded-lg border border-white/10 bg-[#111114] p-3"}>
        <legend className="px-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">{field.label}{field.required ? " *" : ""}</legend>
        <div className="flex flex-wrap gap-3">
          {field.options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={(event) => onChange(event.target.checked ? [...selectedOptions, option] : selectedOptions.filter((item) => item !== option))}
                className="accent-[#d4af37]"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const inputType = field.field_type === "date"
    ? "date"
    : field.field_type === "url"
      ? "url"
      : field.field_type === "number" || field.field_type === "currency"
        ? "number"
        : "text";

  return (
    <label className={labelClass}>
      {field.label}{field.required ? " *" : ""}
      <span className="relative">
        {field.field_type === "currency" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-600">R$</span>}
        <input
          type={inputType}
          step={field.field_type === "currency" ? "0.01" : undefined}
          className={`${inputClass} ${field.field_type === "currency" ? "pl-10" : ""}`}
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}
