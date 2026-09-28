import { requestCatalog } from "../catalogProxy";
import { getYouTubeVideoId } from "../../utils/youtube";

interface YouTubeMetadataResponse {
  title?: unknown;
}

export async function fetchYouTubeTitle(value: string, signal?: AbortSignal) {
  const videoId = getYouTubeVideoId(value);
  if (!videoId) return null;

  const response = await requestCatalog<YouTubeMetadataResponse>(
    "youtube",
    "metadata",
    { searchParams: new URLSearchParams({ videoId }), signal, timeoutMs: 8_000 }
  );
  const title = typeof response.title === "string" ? response.title.trim() : "";

  return title || null;
}
