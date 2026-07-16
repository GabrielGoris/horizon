import { MEDIA_STATUS_OPTIONS } from "../../../../consts/mediaStatus";
import { formatDateInput } from "../../../../utils/date";
import { CompletionRatingField } from "../CompletionRatingField";
import { GamePlatformField } from "../GamePlatformField";
import type { TypeSpecificFieldsProps } from "../../types";

function getCompletionLabel(selectedType: TypeSpecificFieldsProps["selectedType"]) {
  if (selectedType === "games") return "Data em que zerou";
  if (selectedType === "movies" || selectedType === "animes") return "Data assistida";

  return "Data em que leu";
}

export function TypeSpecificFields({
  copy,
  errors,
  inputClass,
  isCampaignHoursLoading,
  labelClass,
  errorClass,
  register,
  selectedType,
  mediaFormat,
  metaValue,
  onMediaFormatChange,
  ratingValue,
  statusValue,
  setValue,
}: TypeSpecificFieldsProps) {
  const isFinished = statusValue === "complete";

  return (
    <>
      <div className="flex flex-col gap-6">
        {(selectedType === "movies" || selectedType === "animes") && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tipo
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#131315] p-1">
                {[
                  { label: "Filme", value: "movie" },
                  { label: "Serie", value: "series" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onMediaFormatChange(option.value as "movie" | "series")}
                    className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      mediaFormat === option.value
                        ? "bg-noir-gold text-black"
                        : "text-neutral-500 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {mediaFormat === "movie" ? (
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
          </>
        )}

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
            <span className="flex items-center justify-between gap-3">
              Tempo da campanha
              {isCampaignHoursLoading && (
                <span className="animate-pulse font-mono text-[10px] font-normal normal-case tracking-normal text-noir-gold">
                  Buscando campanha...
                </span>
              )}
            </span>
            <input
              aria-busy={isCampaignHoursLoading}
              placeholder={isCampaignHoursLoading ? "Buscando tempo da campanha..." : "Ex: 48h 30 min"}
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
      </div>

      {selectedType === "games" ? (
        <GamePlatformField metaValue={metaValue} setValue={setValue} />
      ) : (
        <label className={labelClass}>
          {copy.metaLabel}
          <input
            placeholder={copy.metaPlaceholder}
            {...register("meta")}
            className={inputClass}
          />
        </label>
      )}

      {isFinished && (
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            {getCompletionLabel(selectedType)}
            <input
              placeholder="Ex: 2026 ou 06/07/2026"
              inputMode="numeric"
              {...register(selectedType === "movies" || selectedType === "animes" ? "watched_at" : "completed_year", {
                onChange: (event) => {
                  event.target.value = formatDateInput(event.target.value);
                },
              })}
              className={inputClass}
            />
          </label>

          <CompletionRatingField ratingValue={ratingValue} setValue={setValue} />
        </div>
      )}
    </>
  );
}
