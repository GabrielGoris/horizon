import { MEDIA_STATUS_OPTIONS } from "../../../../consts/mediaStatus";
import { formatDateInput } from "../../../../utils/date";
import type { TypeSpecificFieldsProps } from "../../types";

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
  movieKind,
  onMovieKindChange,
  statusValue,
}: TypeSpecificFieldsProps) {
  const isFinishedMovie = selectedType === "movies" && statusValue === "complete";
  const shouldShowCompletedYear = selectedType !== "movies";

  if (selectedType === "movies") {
    return (
      <>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Tipo
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#131315] p-1">
              {[
                { label: "Filme", value: "movie" },
                { label: "Série", value: "series" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onMovieKindChange(option.value as "movie" | "series")}
                  className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    movieKind === option.value
                      ? "bg-noir-gold text-black"
                      : "text-neutral-500 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {movieKind === "movie" ? (
            <label className={labelClass}>
              Duração
              <input
                placeholder="Ex: 2h 28 min"
                {...register("runtime_minutes")}
                className={inputClass}
              />
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                Temporadas
                <input
                  placeholder="Ex: 5"
                  inputMode="numeric"
                  {...register("season_count")}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Episódios
                <input
                  placeholder="Ex: 62"
                  inputMode="numeric"
                  {...register("episode_count")}
                  className={inputClass}
                />
              </label>
            </div>
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
        </div>

        <div className="grid grid-cols-1 gap-6 sm:col-span-2 sm:grid-cols-2">
          <label className={labelClass}>
            Adicionado em
            <input
              placeholder="Ex: 2026 ou 06/07/2026"
              inputMode="numeric"
              {...register("added_at", {
                onChange: (event) => {
                  event.target.value = formatDateInput(event.target.value);
                },
              })}
              className={inputClass}
            />
          </label>

          {isFinishedMovie && (
            <label className={labelClass}>
              Data assistida
              <input
                placeholder="Ex: 06/07/2026"
                inputMode="numeric"
                {...register("watched_at", {
                  onChange: (event) => {
                    event.target.value = formatDateInput(event.target.value);
                  },
                })}
                className={inputClass}
              />
            </label>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {selectedType === "books" && (
        <label className={labelClass}>
          Páginas da edição
          <input
            placeholder="Ex: 416"
            inputMode="numeric"
            {...register("page_count")}
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
          placeholder="Ex: 06/07/2026"
          inputMode="numeric"
          {...register("added_at", {
            onChange: (event) => {
              event.target.value = formatDateInput(event.target.value);
            },
          })}
          className={inputClass}
        />
      </label>

      {isFinishedMovie && (
        <label className={labelClass}>
          Data assistida
          <input
            placeholder="Ex: 06/07/2026"
            inputMode="numeric"
            {...register("watched_at", {
              onChange: (event) => {
                event.target.value = formatDateInput(event.target.value);
              },
            })}
            className={inputClass}
          />
        </label>
      )}

      {shouldShowCompletedYear && (
        <label className={labelClass}>
          {getCompletedYearLabel(selectedType)}
          <input
            placeholder="Ex: 2026"
            inputMode="numeric"
            {...register("completed_year")}
            className={inputClass}
          />
        </label>
      )}
    </div>
  );
}
