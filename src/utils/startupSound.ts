export type StartupSoundResult = "played" | "blocked" | "failed";

let startupSoundPromise: Promise<StartupSoundResult> | null = null;
let stopCurrentStartupSound: (() => void) | null = null;
let startupAudio: HTMLAudioElement | null = null;
let preparingStartupSound: Promise<void> | null = null;

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

function getStartupAudio() {
  if (startupAudio) return startupAudio;
  startupAudio = new Audio("/audio/film-projector-start.mp3");
  startupAudio.preload = "auto";
  startupAudio.volume = PLAYBACK_VOLUME;
  return startupAudio;
}

export function prepareStartupSound() {
  if (typeof Audio === "undefined" || startupSoundPromise) return Promise.resolve();
  if (preparingStartupSound) return preparingStartupSound;

  const audio = getStartupAudio();
  audio.muted = true;
  preparingStartupSound = audio.play()
    .then(() => {
      audio.pause();
      audio.currentTime = START_TIME_SECONDS;
    })
    .catch(() => undefined)
    .finally(() => {
      audio.muted = false;
    });

  return preparingStartupSound;
}

export function playStartupSound() {
  if (startupSoundPromise) return startupSoundPromise;
  if (typeof Audio === "undefined") return Promise.resolve<StartupSoundResult>("failed");

  startupSoundPromise = (async () => {
    if (preparingStartupSound) await preparingStartupSound;

    return new Promise<StartupSoundResult>((resolve) => {
      const audio = getStartupAudio();
      audio.muted = false;
      audio.volume = PLAYBACK_VOLUME;
      let fadeFrame: number | undefined;
      let finished = false;
      let stopTimer: number | undefined;

      const handleEnded = () => finishPlayback("played");

      function finishPlayback(result: StartupSoundResult, allowRetry = false) {
        if (finished) return;
        finished = true;
        window.clearTimeout(stopTimer);
        if (fadeFrame !== undefined) window.cancelAnimationFrame(fadeFrame);
        audio.removeEventListener("ended", handleEnded);
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
        finishPlayback(wasBlocked ? "blocked" : "failed");
      });
      audio.addEventListener("ended", handleEnded, { once: true });
    });
  })();

  return startupSoundPromise;
}

export function stopStartupSound() {
  stopCurrentStartupSound?.();
  startupAudio?.pause();
  if (startupAudio) startupAudio.currentTime = START_TIME_SECONDS;
  startupSoundPromise = null;
  preparingStartupSound = null;
}
