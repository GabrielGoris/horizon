import type { FieldError, FieldErrors, UseFormGetValues, UseFormRegister, UseFormRegisterReturn, UseFormSetValue } from "react-hook-form";
import type { CreateMediaDTO } from "../../../schemas/media/dto/create-media.dto";
import type { BookCatalogResult, GameCatalogResult, MovieCatalogResult } from "../../../services/types";
import type { MediaItem, MediaType } from "../../../types";
import type { fieldCopy } from "../consts";

export type AddMediaFieldCopy = (typeof fieldCopy)[MediaType];

export interface AddMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDossier?: (item: MediaItem) => void;
  onSuccess: () => void | Promise<void>;
  onPriorityCreate?: (item: MediaItem) => void | Promise<void>;
  initialType?: MediaType | null;
}

export interface PendingDuplicateMedia {
  data: CreateMediaDTO;
  shouldPrioritize: boolean;
}

export interface MediaTypePickerProps {
  onSelect: (type: MediaType) => void;
}

export interface UseMediaCatalogSearchParams {
  getValues: UseFormGetValues<CreateMediaDTO>;
  isOpen: boolean;
  selectedType: MediaType | null;
  setValue: UseFormSetValue<CreateMediaDTO>;
}

export interface CatalogTitleFieldProps {
  bookSearchError: string;
  bookSearchResults: BookCatalogResult[];
  copy: AddMediaFieldCopy;
  error?: FieldError;
  errorClass: string;
  gameSearchError: string;
  gameSearchResults: GameCatalogResult[];
  inputClass: string;
  isBookSearchLoading: boolean;
  isGameSearchLoading: boolean;
  isMovieSearchLoading: boolean;
  labelClass: string;
  movieSearchError: string;
  movieSearchResults: MovieCatalogResult[];
  onBlur: () => void;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSelectBook: (book: BookCatalogResult) => void;
  onSelectGame: (game: GameCatalogResult) => void;
  onSelectMovie: (movie: MovieCatalogResult) => void;
  selectedType: MediaType;
  titleInput: UseFormRegisterReturn<"title">;
}

export interface SearchErrorProps {
  message: string;
}

export interface SearchResultButtonProps {
  cover: string;
  fallbackCover?: string;
  details: string;
  onClick: () => void;
  title: string;
}

export interface CoverFieldProps {
  backdropError?: FieldError;
  backdropInput: UseFormRegisterReturn<"backdrop">;
  backdropValue?: string;
  coverError?: FieldError;
  coverInput: UseFormRegisterReturn<"cover">;
  coverLabel: string;
  coverValue?: string;
  errorClass: string;
  inputClass: string;
  isUploading?: boolean;
  labelClass: string;
  onClear: (kind: "cover" | "backdrop") => void;
  onUpload: (file: File, kind: "cover" | "backdrop") => void | Promise<void>;
}

export interface TypeSpecificFieldsProps {
  copy: AddMediaFieldCopy;
  errors: FieldErrors<CreateMediaDTO>;
  inputClass: string;
  isCampaignHoursLoading: boolean;
  labelClass: string;
  errorClass: string;
  register: UseFormRegister<CreateMediaDTO>;
  selectedType: MediaType;
  mediaFormat: "movie" | "series";
  metaValue?: string;
  onMediaFormatChange: (mediaFormat: "movie" | "series") => void;
  ratingValue?: string;
  setValue: UseFormSetValue<CreateMediaDTO>;
  statusValue?: CreateMediaDTO["status"];
}
