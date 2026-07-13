import type { CreateMediaDTO } from "../../schemas/media";
import { CatalogCache } from "../catalogCache";
import { requestCatalog } from "../catalogProxy";
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
} from "../types";

const searchCache = new CatalogCache<BookCatalogResult[]>();
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
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : "";
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

function getEditionIsbn(edition?: OpenLibrarySearchEdition | OpenLibraryEdition | null) {
  if (!edition) return "";

  if (Object.prototype.hasOwnProperty.call(edition, "isbn")) {
    return (edition as OpenLibrarySearchEdition).isbn?.[0] ?? "";
  }

  const workEdition = edition as OpenLibraryEdition;

  return workEdition.isbn_13?.[0] || workEdition.isbn_10?.[0] || "";
}

async function requestBooks<T>(endpoint: string, searchParams?: URLSearchParams, signal?: AbortSignal) {
  return requestCatalog<T>("books", endpoint, { searchParams, signal });
}

function getEditionScore(edition: OpenLibrarySearchEdition) {
  let score = 0;

  if (isPortugueseEdition(edition)) score += 80;
  if (edition.cover_i || edition.cover_edition_key || getEditionIsbn(edition)) score += 20;
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
  return getCover(edition?.cover_i) || getOlidCover(edition?.cover_edition_key) || getIsbnCover(getEditionIsbn(edition));
}

function mapOpenLibraryBook(item: OpenLibrarySearchItem, sourceScore = 0): BookCatalogResult | null {
  if (!item.key || !item.title) return null;

  const edition = getBestSearchEdition(item);
  const cover = getSearchEditionCover(edition) || getCover(item.cover_i);
  const isbn = getEditionIsbn(edition);

  return {
    id: item.key.replace(/^\//, ""),
    source: "open-library",
    isbn,
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
      if (edition.covers?.[0] || getEditionIsbn(edition)) score += 10;
      if (edition.publishers?.[0]) score += 6;
      if (edition.publish_date) score += 4;

      return score;
    };

    return getScore(second) - getScore(first);
  })[0] ?? null;
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<BookCatalogResult[]> {
  const normalizedQuery = normalizeSearchText(query);
  const cachedResults = searchCache.get(normalizedQuery);

  if (cachedResults) return cachedResults;

  const data = await requestBooks<OpenLibrarySearchResponse>(
    "search.json",
    new URLSearchParams({
      q: query,
      lang: "pt",
      limit: "20",
      fields: searchFields,
    }),
    signal
  );

  const results = (data.docs ?? [])
    .map((item) => mapOpenLibraryBook(item))
    .filter((item): item is BookCatalogResult => Boolean(item))
    .sort((first, second) => (second.searchScore ?? 0) - (first.searchScore ?? 0))
    .filter((item, index, items) => items.findIndex((current) => current.id === item.id) === index)
    .slice(0, 20) ?? [];

  searchCache.set(normalizedQuery, results);

  return results;
}

export async function getBookDetails(book: BookCatalogResult, signal?: AbortSignal): Promise<BookCatalogDetails> {
  if (!book.id.startsWith("works/")) {
    return {
      ...book,
      description: "",
    };
  }

  const [work, editions] = await Promise.all([
    requestBooks<OpenLibraryWork>(`${book.id}.json`, undefined, signal).catch((error) => {
      console.warn("Nao foi possivel carregar a obra na Open Library.", error);

      return null;
    }),
    requestBooks<OpenLibraryEditionsResponse>(
      `${book.id}/editions.json`,
      new URLSearchParams({ limit: "20" }),
      signal
    ).catch((error) => {
      console.warn("Nao foi possivel carregar as edicoes na Open Library.", error);

      return null;
    }),
  ]);
  const edition = getBestEdition(editions?.entries);
  const editionIsbn = getEditionIsbn(edition);
  const editionCover = getCover(edition?.covers?.[0]) || getIsbnCover(editionIsbn);
  const cover = book.cover || editionCover;

  return {
    ...book,
    isbn: book.isbn || editionIsbn,
    cover,
    backdrop: book.backdrop || cover,
    publisher: edition?.publishers?.[0] || book.publisher,
    releaseYear: getReleaseYear(edition?.publish_date) || book.releaseYear,
    pageCount: edition?.number_of_pages ? String(edition.number_of_pages) : book.pageCount,
    category: book.category || work?.subjects?.slice(0, 2).join(", ") || "",
    description: getDescription(work?.description),
  };
}

async function getBookFromSearchByIsbn(normalizedIsbn: string, signal?: AbortSignal) {
  const data = await requestBooks<OpenLibrarySearchResponse>(
    "search.json",
    new URLSearchParams({
      isbn: normalizedIsbn,
      lang: "pt",
      limit: "10",
      fields: searchFields,
    }),
    signal
  );
  const cover = getIsbnCover(normalizedIsbn);
  const book = (data.docs ?? [])
    .map((item, index) => mapOpenLibraryBook(item, 200 - index))
    .filter((item): item is BookCatalogResult => Boolean(item))
    .sort((first, second) => (second.searchScore ?? 0) - (first.searchScore ?? 0))[0];

  if (!book) return null;

  return {
    ...book,
    isbn: normalizedIsbn,
    cover: book.cover || cover,
    backdrop: book.backdrop || book.cover || cover,
    description: "",
  };
}

async function getBookFromIsbnEndpoint(normalizedIsbn: string, signal?: AbortSignal) {
  const edition = await requestBooks<OpenLibraryEdition>(`isbn/${normalizedIsbn}.json`, undefined, signal).catch(() => null);

  if (!edition?.title) return null;

  const workKey = edition.works?.[0]?.key?.replace(/^\//, "");
  const work = workKey
    ? await requestBooks<OpenLibraryWork>(`${workKey}.json`, undefined, signal).catch(() => null)
    : null;
  const cover = getCover(edition.covers?.[0]) || getIsbnCover(normalizedIsbn);

  return {
    id: `isbn/${normalizedIsbn}`,
    source: "open-library",
    isbn: normalizedIsbn,
    title: edition.title,
    releaseYear: getReleaseYear(edition.publish_date),
    cover,
    backdrop: cover,
    category: work?.subjects?.slice(0, 2).join(", ") ?? "",
    author: "",
    publisher: edition.publishers?.[0] ?? "",
    pageCount: edition.number_of_pages ? String(edition.number_of_pages) : "",
    description: getDescription(work?.description),
  } satisfies BookCatalogDetails;
}

export async function getBookByIsbn(isbn: string, signal?: AbortSignal): Promise<BookCatalogDetails> {
  const normalizedIsbn = normalizeIsbn(isbn);

  if (!normalizedIsbn) {
    throw new Error("Informe um ISBN válido.");
  }

  const searchBook = await getBookFromSearchByIsbn(normalizedIsbn, signal);

  if (searchBook) {
    return searchBook;
  }

  const data = await requestBooks<OpenLibraryBookApiResponse>(
    "api/books",
    new URLSearchParams({
      bibkeys: `ISBN:${normalizedIsbn}`,
      format: "json",
      jscmd: "data",
    }),
    signal
  ).catch((): OpenLibraryBookApiResponse => ({}));
  const book = data[`ISBN:${normalizedIsbn}`];

  if (!book) {
    const directBook = await getBookFromIsbnEndpoint(normalizedIsbn, signal);

    if (directBook) {
      return directBook;
    }

    throw new Error("Edição não encontrada pelo ISBN.");
  }

  const cover = book.cover?.large || book.cover?.medium || book.cover?.small || getIsbnCover(normalizedIsbn);

  return {
    id: `isbn/${normalizedIsbn}`,
    source: "open-library",
    isbn: normalizedIsbn,
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
    isbn: book.isbn ?? "",
    page_count: book.pageCount,
    meta: book.publisher,
    description: book.description,
  };
}
