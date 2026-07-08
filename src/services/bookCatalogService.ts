import type { CreateMediaDTO } from "../schemas/media";
import type {
  BookCatalogDetails,
  BookCatalogResult,
  OpenLibraryBookApiResponse,
  OpenLibraryEdition,
  OpenLibrarySearchEdition,
  OpenLibraryEditionsResponse,
  OpenLibrarySearchItem,
  OpenLibrarySearchResponse,
  OpenLibraryWork,
} from "./types";

const booksBaseUrl = "/books-api";
const searchCache = new Map<string, BookCatalogResult[]>();
const portugueseLanguageCodes = new Set(["por", "pt", "pt-br", "pt_br"]);
const searchFields = [
  "key",
  "title",
  "author_name",
  "publisher",
  "first_publish_year",
  "number_of_pages_median",
  "subject",
  "cover_i",
  "edition_count",
  "editions",
  "editions.key",
  "editions.title",
  "editions.language",
  "editions.number_of_pages",
  "editions.publisher",
  "editions.publish_date",
  "editions.cover_i",
  "editions.cover_edition_key",
  "editions.isbn",
].join(",");

function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCover(coverId?: number) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "";
}

function getOlidCover(olid?: string) {
  return olid ? `https://covers.openlibrary.org/b/olid/${olid}-L.jpg` : "";
}

function getIsbnCover(isbn: string) {
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : "";
}

function getReleaseYear(value?: string | number) {
  if (typeof value === "number") return String(value);

  return value?.match(/\d{4}/)?.[0] ?? "";
}

function getDescription(description?: OpenLibraryWork["description"]) {
  if (!description) return "";

  return typeof description === "string" ? description : description.value ?? "";
}

function normalizeLanguage(value: string | { key?: string }) {
  const language = typeof value === "string" ? value : value.key ?? "";

  return language.toLowerCase().replace(/^\/languages\//, "");
}

function getEditionLanguages(edition?: OpenLibrarySearchEdition | OpenLibraryEdition | null): Array<string | { key?: string }> {
  if (!edition) return [];

  if (Object.prototype.hasOwnProperty.call(edition, "language")) {
    const searchEdition = edition as OpenLibrarySearchEdition;

    return searchEdition.language ?? [];
  }

  const workEdition = edition as OpenLibraryEdition;

  return workEdition.languages ?? [];
}

function isPortugueseEdition(edition?: OpenLibrarySearchEdition | OpenLibraryEdition | null) {
  return getEditionLanguages(edition).some((language: string | { key?: string }) => portugueseLanguageCodes.has(normalizeLanguage(language)));
}

async function requestBooks<T>(endpoint: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString();
  const response = await fetch(`${booksBaseUrl}/${endpoint}${query ? `?${query}` : ""}`);

  if (!response.ok) {
    const message = await response.text();

    throw new Error(message || "Nao foi possivel buscar livros agora.");
  }

  return (await response.json()) as T;
}

async function requestBooksText(endpoint: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString();
  const response = await fetch(`${booksBaseUrl}/${endpoint}${query ? `?${query}` : ""}`);
  const content = await response.text();

  if (!response.ok) {
    throw new Error(content || "Não foi possivel buscar livros no momento.");
  }

  return content;
}

function getEditionScore(edition: OpenLibrarySearchEdition) {
  let score = 0;

  if (isPortugueseEdition(edition)) score += 80;
  if (edition.cover_i || edition.cover_edition_key || edition.isbn?.[0]) score += 20;
  if (edition.number_of_pages) score += 12;
  if (edition.publisher?.[0]) score += 6;
  if (edition.publish_date?.[0]) score += 4;

  return score;
}

function getBestSearchEdition(item: OpenLibrarySearchItem) {
  const editions = item.editions?.docs ?? [];

  return [...editions].sort((first, second) => getEditionScore(second) - getEditionScore(first))[0] ?? null;
}

function getSearchEditionCover(edition?: OpenLibrarySearchEdition | null) {
  return getCover(edition?.cover_i) || getOlidCover(edition?.cover_edition_key) || getIsbnCover(edition?.isbn?.[0] ?? "");
}

function mapOpenLibraryBook(item: OpenLibrarySearchItem, sourceScore = 0): BookCatalogResult | null {
  if (!item.key || !item.title) return null;

  const edition = getBestSearchEdition(item);
  const cover = getSearchEditionCover(edition) || getCover(item.cover_i);

  return {
    id: item.key.replace(/^\//, ""),
    source: "open-library",
    title: edition?.title || item.title,
    releaseYear: getReleaseYear(edition?.publish_date?.[0]) || (item.first_publish_year ? String(item.first_publish_year) : ""),
    cover,
    backdrop: cover,
    category: item.subject?.slice(0, 2).join(", ") ?? "",
    author: item.author_name?.slice(0, 2).join(", ") ?? "",
    publisher: edition?.publisher?.[0] || item.publisher?.[0] || "",
    pageCount: edition?.number_of_pages ? String(edition.number_of_pages) : item.number_of_pages_median ? String(item.number_of_pages_median) : "",
    searchScore: sourceScore + (edition ? getEditionScore(edition) : 0) + (item.edition_count ?? 0),
  };
}

function getBestEdition(editions?: OpenLibraryEdition[]) {
  if (!editions?.length) return null;

  return [...editions].sort((first, second) => {
    const getScore = (edition: OpenLibraryEdition) => {
      let score = 0;

      if (isPortugueseEdition(edition)) score += 80;
      if (edition.number_of_pages) score += 12;
      if (edition.covers?.[0]) score += 10;
      if (edition.publishers?.[0]) score += 6;
      if (edition.publish_date) score += 4;

      return score;
    };

    return getScore(second) - getScore(first);
  })[0] ?? null;
}

export async function searchBooks(query: string): Promise<BookCatalogResult[]> {
  const normalizedQuery = normalizeSearchText(query);

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery) ?? [];
  }

  const [portugueseData, broadData] = await Promise.all([
    requestBooks<OpenLibrarySearchResponse>(
      "search.json",
      new URLSearchParams({
        q: `${query} language:por`,
        lang: "pt",
        limit: "20",
        fields: searchFields,
      })
    ).catch(() => ({ docs: [] })),
    requestBooks<OpenLibrarySearchResponse>(
      "search.json",
      new URLSearchParams({
        q: query,
        lang: "pt",
        limit: "30",
        fields: searchFields,
      })
    ),
  ]);

  const results = [...(portugueseData.docs ?? []), ...(broadData.docs ?? [])]
    .map((item, index) => mapOpenLibraryBook(item, index < (portugueseData.docs?.length ?? 0) ? 200 : 0))
    .filter((item): item is BookCatalogResult => Boolean(item))
    .sort((first, second) => (second.searchScore ?? 0) - (first.searchScore ?? 0))
    .filter((item, index, items) => items.findIndex((current) => current.id === item.id) === index)
    .slice(0, 20) ?? [];

  searchCache.set(normalizedQuery, results);

  return results;
}

export async function getBookDetails(book: BookCatalogResult): Promise<BookCatalogDetails> {
  if (!book.id.startsWith("works/")) {
    return {
      ...book,
      description: "",
    };
  }

  const work = await requestBooks<OpenLibraryWork>(`${book.id}.json`);
  const editions = await requestBooks<OpenLibraryEditionsResponse>(
    `${book.id}/editions.json`,
    new URLSearchParams({ limit: "20" })
  ).catch(() => null);
  const edition = getBestEdition(editions?.entries);
  const editionCover = getCover(edition?.covers?.[0]);

  return {
    ...book,
    cover: editionCover || book.cover,
    backdrop: editionCover || book.backdrop,
    publisher: edition?.publishers?.[0] || book.publisher,
    releaseYear: getReleaseYear(edition?.publish_date) || book.releaseYear,
    pageCount: edition?.number_of_pages ? String(edition.number_of_pages) : book.pageCount,
    category: book.category || work.subjects?.slice(0, 2).join(", ") || "",
    description: getDescription(work.description),
  };
}

export async function getBookByIsbn(isbn: string): Promise<BookCatalogDetails> {
  const normalizedIsbn = normalizeIsbn(isbn);

  if (!normalizedIsbn) {
    throw new Error("Informe um ISBN válido.");
  }

  const content = await requestBooksText(
    "api/books",
    new URLSearchParams({
      bibkeys: `ISBN:${normalizedIsbn}`,
      format: "json",
      jscmd: "data",
    })
  );
  const data = JSON.parse(content) as OpenLibraryBookApiResponse;
  const book = data[`ISBN:${normalizedIsbn}`];

  if (!book) {
    throw new Error("Edição não encontrada pelo ISBN.");
  }

  const cover = book.cover?.large || book.cover?.medium || book.cover?.small || getIsbnCover(normalizedIsbn);

  return {
    id: `isbn/${normalizedIsbn}`,
    source: "open-library",
    title: book.title ?? "",
    releaseYear: getReleaseYear(book.publish_date),
    cover,
    backdrop: cover,
    category: book.subjects?.map((subject) => subject.name).filter(Boolean).slice(0, 2).join(", ") ?? "",
    author: book.authors?.map((author) => author.name).filter(Boolean).slice(0, 2).join(", ") ?? "",
    publisher: book.publishers?.[0]?.name ?? "",
    pageCount: book.number_of_pages ? String(book.number_of_pages) : "",
    description: book.excerpts?.[0]?.text ?? "",
  };
}

export function applyBookCatalogDetails(book: BookCatalogDetails): Partial<CreateMediaDTO> {
  return {
    title: book.title,
    creator: book.author,
    category: book.category,
    cover: book.cover,
    backdrop: book.backdrop ?? "",
    release_year: book.releaseYear,
    page_count: book.pageCount,
    meta: book.publisher,
    description: book.description,
  };
}
