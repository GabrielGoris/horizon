const preloadedBackdropUrls = new Set<string>();

export function getDossierBackdropUrl(url?: string) {
  if (!url) return undefined;

  return url.replace(/(image\.tmdb\.org\/t\/p\/)(?:original|w\d+)(\/)/, "$1w300$2");
}

export function preloadDossierBackdrop(url?: string) {
  const backdropUrl = getDossierBackdropUrl(url);

  if (!backdropUrl || preloadedBackdropUrls.has(backdropUrl) || typeof Image === "undefined") return;

  preloadedBackdropUrls.add(backdropUrl);
  const image = new Image();
  image.decoding = "async";
  image.src = backdropUrl;
}
