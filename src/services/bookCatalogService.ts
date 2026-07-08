import type { CreateMediaDTO } from "../schemas/media";
import type {
  BookCatalogDetails,
  BookCatalogResult,
  OpenLibraryBookApiResponse,
  OpenLibraryEdition,
  OpenLibraryEditionsResponse,
  OpenLibrarySearchItem,
  OpenLibrarySearchResponse,
  OpenLibraryWork,
} from "./types";

const booksBaseUrl = "/books-api";
const searchCache = new Map<string, BookCatalogResult[]>();

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

function mapOpenLibraryBook(item: OpenLibrarySearchItem): BookCatalogResult | null {
  if (!item.key || !item.title) return null;

  const cover = getCover(item.cover_i);

  return {
    id: item.key.replace(/^\//, ""),
    source: "open-library",
    title: item.title,
    releaseYear: item.first_publish_year ? String(item.first_publish_year) : "",
    cover,
    backdrop: cover,
    category: item.subject?.slice(0, 2).join(", ") ?? "",
    author: item.author_name?.slice(0, 2).join(", ") ?? "",
    publisher: item.publisher?.[0] ?? "",
    pageCount: item.number_of_pages_median ? String(item.number_of_pages_median) : "",
  };
}

function getBestEdition(editions?: OpenLibraryEdition[]) {
  return editions?.find((edition) => Boolean(edition.number_of_pages)) ?? editions?.[0] ?? null;
}

export async function searchBooks(query: string): Promise<BookCatalogResult[]> {
  const normalizedQuery = normalizeSearchText(query);

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery) ?? [];
  }

  const data = await requestBooks<OpenLibrarySearchResponse>(
    "search.json",
    new URLSearchParams({
      q: query,
      limit: "20",
      fields: [
        "key",
        "title",
        "author_name",
      "publisher",
      "first_publish_year",
      "number_of_pages_median",
      "subject",
      "cover_i",
      "edition_count",
      ].join(","),
    })
  );

  const results = data.docs
    ?.map(mapOpenLibraryBook)
    .filter((item): item is BookCatalogResult => Boolean(item))
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
