import type { FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { CreateMediaDTO } from "../../../../schemas/media/dto/create-media.dto";
import type { MediaCatalogSearch } from "../../hooks/useMediaCatalogSearch";
import type { AddMediaFieldCopy } from "../../types";

export type BasicInfoFieldsProps = {
  catalogSearch: MediaCatalogSearch;
  copy: AddMediaFieldCopy;
  errorClass: string;
  errors: FieldErrors<CreateMediaDTO>;
  getValues: UseFormGetValues<CreateMediaDTO>;
  inputClass: string;
  labelClass: string;
  onMovieKindChange: (movieKind: "movie" | "series") => void;
  register: UseFormRegister<CreateMediaDTO>;
  selectedType: CreateMediaDTO["type"];
  setValue: UseFormSetValue<CreateMediaDTO>;
};

export type CoverDetailsFieldsProps = {
  catalogSearch: MediaCatalogSearch;
  copy: AddMediaFieldCopy;
  coverValue?: string;
  errorClass: string;
  errors: FieldErrors<CreateMediaDTO>;
  inputClass: string;
  labelClass: string;
  metaValue?: string;
  movieKind: "movie" | "series";
  onMovieKindChange: (movieKind: "movie" | "series") => void;
  ratingValue?: string;
  register: UseFormRegister<CreateMediaDTO>;
  selectedType: CreateMediaDTO["type"];
  setValue: UseFormSetValue<CreateMediaDTO>;
  statusValue?: CreateMediaDTO["status"];
};

export type FormActionsProps = {
  isCatalogSelectionLoading: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitWithPriority: () => void;
};

export type CompletionRatingFieldProps = {
  ratingValue?: string;
  setValue: UseFormSetValue<CreateMediaDTO>;
};

export type GamePlatformFieldProps = {
  metaValue?: string;
  setValue: UseFormSetValue<CreateMediaDTO>;
};
