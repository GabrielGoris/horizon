export type CatalogProxyService = "books" | "brasil-api" | "google-books" | "hltb" | "igdb" | "steam" | "tmdb";

type CatalogRequestOptions = Omit<RequestInit, "signal"> & {
  searchParams?: URLSearchParams;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export function getCatalogProxyUrl(service: CatalogProxyService, endpoint: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString();
  const endpointWithQuery = `${endpoint}${query ? `?${query}` : ""}`;

  return `/api/catalog-proxy?${new URLSearchParams({
    service,
    endpoint: endpointWithQuery,
  }).toString()}`;
}

function getResponseMessage(content: string) {
  try {
    const parsed = JSON.parse(content) as { message?: unknown };

    return typeof parsed.message === "string" ? parsed.message : content;
  } catch {
    return content;
  }
}

export async function requestCatalog<T>(
  service: CatalogProxyService,
  endpoint: string,
  options: CatalogRequestOptions = {}
) {
  const {
    searchParams,
    signal,
    timeoutMs = 12_000,
    ...requestInit
  } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abortRequest = () => controller.abort();
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", abortRequest, { once: true });
  }

  try {
    const response = await fetch(getCatalogProxyUrl(service, endpoint, searchParams), {
      ...requestInit,
      signal: controller.signal,
    });
    const content = await response.text();

    if (!response.ok) {
      throw new Error(getResponseMessage(content) || "Não foi possivel consultar o catálogo agora.");
    }

    try {
      return JSON.parse(content) as T;
    } catch {
      throw new Error(
        content.trimStart().startsWith("<")
          ? "O proxy local do catálogo retornou a aplicação em vez de dados."
          : "O catálogo retornou uma resposta invalida."
      );
    }
  } catch (error) {
    if (timedOut) {
      throw new Error("O catálogo demorou demais para responder.", { cause: error });
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
  }
}
