export type CatalogProxyService = "books" | "igdb" | "steam" | "tmdb";

export function getCatalogProxyUrl(service: CatalogProxyService, endpoint: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString();
  const endpointWithQuery = `${endpoint}${query ? `?${query}` : ""}`;

  return `/api/catalog-proxy?${new URLSearchParams({
    service,
    endpoint: endpointWithQuery,
  }).toString()}`;
}
