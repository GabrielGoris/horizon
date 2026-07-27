const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function getYouTubeVideoId(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0];

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v") ?? undefined;

    const [kind, videoId] = url.pathname.split("/").filter(Boolean);
    if (["embed", "live", "shorts"].includes(kind)) return videoId;
  }

  return undefined;
}

export function getYouTubeThumbnailUrl(value: string) {
  try {
    const videoId = getYouTubeVideoId(new URL(value.trim()));
    return videoId && YOUTUBE_VIDEO_ID.test(videoId)
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : undefined;
  } catch {
    return undefined;
  }
}
