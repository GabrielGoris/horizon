import type { FieldError, FieldErrors, UseFormRegister, UseFormRegisterReturn, UseFormSetValue } from "react-hook-form";
import type { CreateMediaDTO } from "../../../schemas/media/dto/create-media.dto";
import type { BookCatalogResult, GameCatalogResult, MovieCatalogResult } from "../../../services/types";
import type { MediaItem, MediaType } from "../../../types";
import type { fieldCopy } from "../consts";

export type AddMediaFieldCopy = (typeof fieldCopy)[MediaType];

export interface AddMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  onPriorityCreate?: (item: MediaItem) => void | Promise<void>;
  initialType?: MediaType | null;
}

export interface MediaTypePickerProps {
  onSelect: (type: MediaType) => void;
}

export interface UseMediaCatalogSearchParams {
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
  className?: string;
  coverBackground: string;
  coverFallback?: string;
  coverInput: UseFormRegisterReturn<"cover">;
  coverLabel: string;
  coverValue?: string;
  error?: FieldError;
  errorClass: string;
  inputClass: string;
  labelClass: string;
  onUseCoverFallback?: (cover: string) => void;
}

export interface TypeSpecificFieldsProps {
  copy: AddMediaFieldCopy;
  errors: FieldErrors<CreateMediaDTO>;
  inputClass: string;
  labelClass: string;
  errorClass: string;
  register: UseFormRegister<CreateMediaDTO>;
  selectedType: MediaType;
  movieKind: "movie" | "series";
  metaValue?: string;
  onMovieKindChange: (movieKind: "movie" | "series") => void;
  ratingValue?: string;
  setValue: UseFormSetValue<CreateMediaDTO>;
  statusValue?: CreateMediaDTO["status"];
}
