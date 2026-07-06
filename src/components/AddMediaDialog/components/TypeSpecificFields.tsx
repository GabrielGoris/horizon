import type { TypeSpecificFieldsProps } from "../types";

export function TypeSpecificFields({
  copy,
  errors,
  inputClass,
  labelClass,
  errorClass,
  register,
  selectedType,
}: TypeSpecificFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      {selectedType === "books" && (
        <label className={labelClass}>
          Paginas da edicao
          <input
            placeholder="Ex: 416"
            inputMode="numeric"
            {...register("page_count")}
            className={inputClass}
          />
        </label>
      )}

      {selectedType === "movies" && (
        <label className={labelClass}>
          Duracao
          <input
            placeholder="Ex: 2h 28 min"
            {...register("runtime_minutes")}
            className={inputClass}
          />
        </label>
      )}

      {selectedType === "games" && (
        <label className={labelClass}>
          Tempo da campanha
          <input
            placeholder="Ex: 48h 30 min"
            {...register("campaign_hours")}
            className={inputClass}
          />
        </label>
      )}

      <label className={labelClass}>
        Estado na Biblioteca *
        <select {...register("status")} className={inputClass}>
          <option value="queue">{copy.statusOptions.queue}</option>
          <option value="reading">{copy.statusOptions.reading}</option>
          <option value="new">{copy.statusOptions.new}</option>
          <option value="complete">{copy.statusOptions.complete}</option>
        </select>
        {errors.status && <span className={errorClass}>{errors.status.message}</span>}
      </label>
    </div>
  );
}
