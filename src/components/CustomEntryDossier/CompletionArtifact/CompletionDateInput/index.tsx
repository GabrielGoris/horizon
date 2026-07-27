import { formatDateInput, toSupabaseDate } from "../../../../utils/date";

interface CompletionDateInputProps {
  className?: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  value: string;
}

export function CompletionDateInput({ className = "", onChange, onCommit, value }: CompletionDateInputProps) {
  return (
    <input
      aria-label="Data da conclusão"
      type="text"
      value={value}
      placeholder="DD/MM/AAAA"
      inputMode="numeric"
      onChange={(event) => onChange(formatDateInput(event.target.value))}
      onBlur={(event) => {
        const formattedValue = formatDateInput(event.target.value);
        if (toSupabaseDate(formattedValue)) onCommit(formattedValue);
      }}
      className={`h-6 min-w-0 max-w-[118px] border-0 bg-transparent p-0 font-mono text-[8px] uppercase tracking-wider outline-none placeholder:opacity-60 ${className}`}
    />
  );
}
