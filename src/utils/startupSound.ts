export type StartupSoundResult = "played" | "blocked" | "failed";

let startupSoundPromise: Promise<StartupSoundResult> | null = null;
let stopCurrentStartupSound: (() => void) | null = null;

const START_TIME_SECONDS = 0;
const SEGMENT_DURATION_MS = 3_000;
const FADE_DURATION_MS = 120;
const PLAYBACK_VOLUME = 0.1;

function isAutoplayBlocked(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "name" in error
    && error.name === "NotAllowedError";
}

export function playStartupSound() {
  if (startupSoundPromise) return startupSoundPromise;
  if (typeof Audio === "undefined") return Promise.resolve<StartupSoundResult>("failed");

  startupSoundPromise = new Promise<StartupSoundResult>((resolve) => {
    const audio = new Audio("/audio/film-projector-start.mp3");
    audio.preload = "auto";
    audio.volume = PLAYBACK_VOLUME;
    let fadeFrame: number | undefined;
    let finished = false;
    let stopTimer: number | undefined;

    function finishPlayback(result: StartupSoundResult, allowRetry = false) {
      if (finished) return;
      finished = true;
      window.clearTimeout(stopTimer);
      if (fadeFrame !== undefined) window.cancelAnimationFrame(fadeFrame);
      audio.pause();
      audio.volume = PLAYBACK_VOLUME;
      stopCurrentStartupSound = null;
      if (allowRetry) startupSoundPromise = null;
      resolve(result);
    }

    function scheduleStop() {
      stopTimer = window.setTimeout(() => {
        const fadeStartedAt = performance.now();
        const fadeOut = (now: number) => {
          const progress = Math.min(1, (now - fadeStartedAt) / FADE_DURATION_MS);
          audio.volume = PLAYBACK_VOLUME * (1 - progress);

          if (progress < 1) fadeFrame = window.requestAnimationFrame(fadeOut);
          else finishPlayback("played");
        };

        fadeFrame = window.requestAnimationFrame(fadeOut);
      }, SEGMENT_DURATION_MS - FADE_DURATION_MS);
    }

    stopCurrentStartupSound = () => finishPlayback("failed", true);
    audio.currentTime = START_TIME_SECONDS;
    void audio.play().then(scheduleStop).catch((error: unknown) => {
      const wasBlocked = isAutoplayBlocked(error);
      finishPlayback(wasBlocked ? "blocked" : "failed", wasBlocked);
    });
    audio.addEventListener("ended", () => finishPlayback("played"), { once: true });
  });

  return startupSoundPromise;
}

export function stopStartupSound() {
  stopCurrentStartupSound?.();
  startupSoundPromise = null;
}
