import type { TypeSpecificFieldsProps } from "../types";
import { MEDIA_STATUS_OPTIONS } from "../../../consts/mediaStatus";

function getCompletedYearLabel(selectedType: TypeSpecificFieldsProps["selectedType"]) {
  if (selectedType === "games") return "Ano em que zerou";
  if (selectedType === "movies") return "Ano em que assistiu";

  return "Ano em que leu";
}

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
          {MEDIA_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {copy.statusOptions[status]}
            </option>
          ))}
        </select>
        {errors.status && <span className={errorClass}>{errors.status.message}</span>}
      </label>

      <label className={labelClass}>
        Adicionado em
        <input
          type="date"
          {...register("added_at")}
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        {getCompletedYearLabel(selectedType)}
        <input
          placeholder="Ex: 2026"
          inputMode="numeric"
          {...register("completed_year")}
          className={inputClass}
        />
      </label>
    </div>
  );
}
