export type ExistingMediaIdentity = {
  creator: string | null;
  meta: string | null;
  media_format: "movie" | "series" | null;
  release_year: string | null;
  title: string;
};
