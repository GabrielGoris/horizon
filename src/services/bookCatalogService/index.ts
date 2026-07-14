import type { CreateMediaDTO } from "../../schemas/media";
import { CatalogCache } from "../catalogCache";
import { requestCatalog } from "../catalogProxy";
import type {
  BookCatalogDetails,
  BookCatalogResult,
  BrasilApiBookResponse,
  GoogleBooksResponse,
  GoogleBooksVolume,
  OpenLibraryBookApiResponse,
  OpenLibraryEdition,
  OpenLibrarySearchEdition,
  OpenLibraryEditionsResponse,
  OpenLibrarySearchItem,
  OpenLibrarySearchResponse,
  OpenLibraryWork,
} from "../types";

const searchCache = new CatalogCache<BookCatalogResult[]>();
const knownBooksStorageKey = "horizon:known-isbn-books";
const knownBooksByIsbn = new Map<string, BookCatalogDetails>();
let knownBooksLoaded = false;
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

function isValidIsbn10(value: string) {
  if (!/^\d{9}[\dX]$/.test(value)) return false;

  const checksum = [...value].reduce((total, character, index) => {
    const digit = character === "X" ? 10 : Number(character);

    return total + digit * (10 - index);
  }, 0);

  return checksum % 11 === 0;
}

function isValidIsbn13(value: string) {
  if (!/^\d{13}$/.test(value)) return false;

  const checksum = [...value.slice(0, 12)].reduce(
    (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
    0
  );

  return (10 - checksum % 10) % 10 === Number(value[12]);
}

function convertIsbn10To13(value: string) {
  const core = `978${value.slice(0, 9)}`;
  const checksum = [...core].reduce(
    (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
    0
  );

  return `${core}${(10 - checksum % 10) % 10}`;
}

function convertIsbn13To10(value: string) {
  if (!value.startsWith("978")) return "";

  const core = value.slice(3, 12);
  const checksum = [...core].reduce(
    (total, character, index) => total + Number(character) * (10 - index),
    0
  );
  const checkDigit = (11 - checksum % 11) % 11;

  return `${core}${checkDigit === 10 ? "X" : checkDigit}`;
}

function getIsbnVariants(value: string) {
  if (isValidIsbn10(value)) {
    return [value, convertIsbn10To13(value)];
  }

  if (isValidIsbn13(value)) {
    return [value, convertIsbn13To10(value)].filter(Boolean);
  }

  return [];
}

function isBrazilianIsbn(value: string) {
  return value.startsWith("97865")
    || value.startsWith("97885")
    || value.startsWith("65")
    || value.startsWith("85");
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

function getAmazonCover(isbn: string) {
  const isbn10 = getIsbnVariants(normalizeIsbn(isbn)).find((variant) => variant.length === 10);

  return isbn10
    ? `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`
    : "";
}

function getFallbackBookCover(isbn: string) {
  return getAmazonCover(isbn) || getIsbnCover(isbn);
}

function normalizeGoogleImageUrl(url?: string) {
  return url?.replace(/^http:/, "https:") ?? "";
}

function getGoogleCover(volume: GoogleBooksVolume) {
  const links = volume.volumeInfo?.imageLinks;

  return normalizeGoogleImageUrl(
    links?.extraLarge
    || links?.large
    || links?.medium
    || links?.small
    || links?.thumbnail
    || links?.smallThumbnail
  );
}

function stripHtml(value?: string) {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function isStoredBook(value: unknown): value is BookCatalogDetails {
  if (typeof value !== "object" || value === null) return false;

  const book = value as Partial<BookCatalogDetails>;

  return typeof book.id === "string"
    && typeof book.title === "string"
    && typeof book.isbn === "string"
    && typeof book.source === "string";
}

function loadKnownBooks() {
  if (knownBooksLoaded || typeof window === "undefined") return;

  knownBooksLoaded = true;

  try {
    const storedBooks = JSON.parse(window.localStorage.getItem(knownBooksStorageKey) ?? "[]") as unknown;

    if (!Array.isArray(storedBooks)) return;

    storedBooks.filter(isStoredBook).slice(-100).forEach((book) => {
      knownBooksByIsbn.set(normalizeIsbn(book.isbn ?? ""), book);
    });
  } catch {
    window.localStorage.removeItem(knownBooksStorageKey);
  }
}

function rememberBook(book: BookCatalogDetails) {
  const isbn = normalizeIsbn(book.isbn ?? "");

  if (!isbn) return book;

  loadKnownBooks();
  knownBooksByIsbn.delete(isbn);
  knownBooksByIsbn.set(isbn, book);

  while (knownBooksByIsbn.size > 100) {
    const oldestIsbn = knownBooksByIsbn.keys().next().value;

    if (oldestIsbn === undefined) break;
    knownBooksByIsbn.delete(oldestIsbn);
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(knownBooksStorageKey, JSON.stringify(Array.from(knownBooksByIsbn.values())));
    } catch {
      // The in-memory catalog still works when storage is unavailable.
    }
  }

  return book;
}

function getKnownBookResults(query: string) {
  loadKnownBooks();

  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  return Array.from(knownBooksByIsbn.values())
    .filter((book) => {
      const searchableText = normalizeSearchText(`${book.title} ${book.author} ${book.publisher}`);

      return searchableText.includes(normalizedQuery)
        || queryTokens.every((token) => searchableText.includes(token));
    })
    .map((book) => ({ ...book, searchScore: 2_000 } satisfies BookCatalogResult));
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

async function requestGoogleBooks<T>(searchParams: URLSearchParams, signal?: AbortSignal) {
  return requestCatalog<T>("google-books", "volumes", { searchParams, signal });
}

async function requestBrasilApi<T>(isbn: string, signal?: AbortSignal) {
  return requestCatalog<T>("brasil-api", `isbn/v1/${isbn}`, { signal });
}

async function getBookFromBrasilApi(isbn: string, signal?: AbortSignal) {
  if (!isBrazilianIsbn(isbn)) return null;

  const data = await requestBrasilApi<BrasilApiBookResponse>(isbn, signal).catch((error) => {
    if (error instanceof Error && error.name === "AbortError") throw error;

    return null;
  });

  if (!data?.title) return null;

  const cover = normalizeGoogleImageUrl(data.cover_url ?? "") || getFallbackBookCover(isbn);

  return {
    id: `brasil-api/${isbn}`,
    source: "brasil-api",
    isbn,
    title: data.subtitle ? `${data.title}: ${data.subtitle}` : data.title,
    releaseYear: data.year ? String(data.year) : "",
    cover,
    backdrop: cover,
    category: data.subjects?.slice(0, 2).join(", ") ?? "",
    author: data.authors?.slice(0, 2).join(", ") ?? "",
    publisher: data.publisher ?? "",
    pageCount: data.page_count ? String(data.page_count) : "",
    description: stripHtml(data.synopsis ?? ""),
  } satisfies BookCatalogDetails;
}

function getGoogleVolumeIsbns(volume: GoogleBooksVolume) {
  return volume.volumeInfo?.industryIdentifiers
    ?.map((identifier) => normalizeIsbn(identifier.identifier ?? ""))
    .filter(Boolean) ?? [];
}

function mapGoogleBook(volume: GoogleBooksVolume, requestedIsbn: string): BookCatalogDetails | null {
  const info = volume.volumeInfo;

  if (!info?.title) return null;

  const cover = getGoogleCover(volume) || getFallbackBookCover(requestedIsbn);

  return {
    id: `google-books/${volume.id || requestedIsbn}`,
    source: "google-books",
    isbn: requestedIsbn,
    title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
    releaseYear: getReleaseYear(info.publishedDate),
    cover,
    backdrop: cover,
    category: info.categories?.slice(0, 2).join(", ") ?? "",
    author: info.authors?.slice(0, 2).join(", ") ?? "",
    publisher: info.publisher ?? "",
    pageCount: info.pageCount ? String(info.pageCount) : "",
    description: stripHtml(info.description),
  };
}

async function getBookFromGoogleBooks(isbnVariants: string[], signal?: AbortSignal) {
  for (const isbn of isbnVariants) {
    const data = await requestGoogleBooks<GoogleBooksResponse>(
      new URLSearchParams({
        q: `isbn:${isbn}`,
        maxResults: "5",
        printType: "books",
        projection: "full",
      }),
      signal
    ).catch((error) => {
      if (error instanceof Error && error.name === "AbortError") throw error;

      console.warn("Nao foi possivel consultar o Google Books.", error);
      return null;
    });

    if (!data?.items?.length) continue;

    const exactVolume = data.items.find((volume) =>
      getGoogleVolumeIsbns(volume).some((volumeIsbn) => isbnVariants.includes(volumeIsbn))
    );
    const book = mapGoogleBook(exactVolume ?? data.items[0], isbn);

    if (book) return book;
  }

  return null;
}

async function searchGoogleBooks(query: string, signal?: AbortSignal): Promise<BookCatalogResult[]> {
  const data = await requestGoogleBooks<GoogleBooksResponse>(
    new URLSearchParams({
      q: query,
      langRestrict: "pt",
      maxResults: "20",
      orderBy: "relevance",
      printType: "books",
      projection: "full",
    }),
    signal
  );

  const results: BookCatalogResult[] = [];

  (data.items ?? []).forEach((volume) => {
    const volumeIsbns = getGoogleVolumeIsbns(volume);
    const isbn = volumeIsbns.find((value) => value.length === 13) || volumeIsbns[0] || "";
    const book = mapGoogleBook(volume, isbn);

    if (book) results.push({ ...book, searchScore: 500 });
  });

  return results;
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
  return getCover(edition?.cover_i) || getOlidCover(edition?.cover_edition_key) || getFallbackBookCover(getEditionIsbn(edition));
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
  const knownResults = getKnownBookResults(query);

  if (cachedResults) {
    return [...knownResults, ...cachedResults]
      .filter((book, index, books) => {
        const key = normalizeIsbn(book.isbn ?? "") || normalizeSearchText(book.title);

        return books.findIndex((candidate) =>
          (normalizeIsbn(candidate.isbn ?? "") || normalizeSearchText(candidate.title)) === key
        ) === index;
      })
      .slice(0, 20);
  }

  const [openLibraryRequest, googleBooksRequest] = await Promise.allSettled([
    requestBooks<OpenLibrarySearchResponse>(
      "search.json",
      new URLSearchParams({
        q: query,
        lang: "pt",
        limit: "20",
        fields: searchFields,
      }),
      signal
    ),
    searchGoogleBooks(query, signal),
  ]);

  if (openLibraryRequest.status === "rejected" && googleBooksRequest.status === "rejected") {
    throw openLibraryRequest.reason instanceof Error ? openLibraryRequest.reason : googleBooksRequest.reason;
  }

  const openLibraryData = openLibraryRequest.status === "fulfilled" ? openLibraryRequest.value : null;
  const googleBooks = googleBooksRequest.status === "fulfilled" ? googleBooksRequest.value : [];

  const openLibraryBooks = (openLibraryData?.docs ?? [])
    .map((item) => mapOpenLibraryBook(item))
    .filter((item): item is BookCatalogResult => Boolean(item))
    .sort((first, second) => (second.searchScore ?? 0) - (first.searchScore ?? 0));
  const results = [...knownResults, ...googleBooks, ...openLibraryBooks]
    .filter((book, index, books) => {
      const key = normalizeIsbn(book.isbn ?? "") || normalizeSearchText(book.title);

      return books.findIndex((candidate) =>
        (normalizeIsbn(candidate.isbn ?? "") || normalizeSearchText(candidate.title)) === key
      ) === index;
    })
    .slice(0, 20);

  if (openLibraryRequest.status === "fulfilled" && googleBooksRequest.status === "fulfilled") {
    searchCache.set(normalizedQuery, results);
  }

  return results;
}

export async function getBookDetails(book: BookCatalogResult, signal?: AbortSignal): Promise<BookCatalogDetails> {
  if (!book.id.startsWith("works/")) {
    return {
      ...book,
      description: book.description ?? "",
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
  const editionCover = getCover(edition?.covers?.[0]) || getFallbackBookCover(editionIsbn);
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
  const cover = getFallbackBookCover(normalizedIsbn);
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
  const cover = getCover(edition.covers?.[0]) || getFallbackBookCover(normalizedIsbn);

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
  const isbnVariants = getIsbnVariants(normalizedIsbn);

  if (isbnVariants.length === 0) {
    throw new Error("ISBN inválido. Confira os 10 ou 13 dígitos informados.");
  }

  const brasilApiBook = await getBookFromBrasilApi(normalizedIsbn, signal);

  if (brasilApiBook) {
    return rememberBook(brasilApiBook);
  }

  const googleBook = await getBookFromGoogleBooks(isbnVariants, signal);

  if (googleBook) {
    return rememberBook({
      ...googleBook,
      isbn: normalizedIsbn,
    });
  }

  let searchBook: BookCatalogDetails | null = null;

  for (const isbnVariant of isbnVariants) {
    searchBook = await getBookFromSearchByIsbn(isbnVariant, signal);

    if (searchBook) break;
  }

  if (searchBook) {
    return rememberBook({
      ...searchBook,
      isbn: normalizedIsbn,
    });
  }

  const data = await requestBooks<OpenLibraryBookApiResponse>(
    "api/books",
    new URLSearchParams({
      bibkeys: isbnVariants.map((isbnVariant) => `ISBN:${isbnVariant}`).join(","),
      format: "json",
      jscmd: "data",
    }),
    signal
  ).catch((): OpenLibraryBookApiResponse => ({}));
  const book = isbnVariants
    .map((isbnVariant) => data[`ISBN:${isbnVariant}`])
    .find(Boolean);

  if (!book) {
    let directBook: BookCatalogDetails | null = null;

    for (const isbnVariant of isbnVariants) {
      directBook = await getBookFromIsbnEndpoint(isbnVariant, signal);

      if (directBook) break;
    }

    if (directBook) {
      return rememberBook({
        ...directBook,
        isbn: normalizedIsbn,
      });
    }

    throw new Error("Edição não encontrada na BrasilAPI, Google Books ou Open Library.");
  }

  const cover = book.cover?.large || book.cover?.medium || book.cover?.small || getFallbackBookCover(normalizedIsbn);

  return rememberBook({
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
  });
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
