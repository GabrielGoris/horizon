let startupSoundPromise: Promise<void> | null = null;
let stopCurrentStartupSound: (() => void) | null = null;

const START_TIME_SECONDS = 0;
const SEGMENT_DURATION_MS = 3_000;
const FADE_DURATION_MS = 120;
const PLAYBACK_VOLUME = 0.1;

export function playStartupSound() {
  if (startupSoundPromise) return startupSoundPromise;
  if (typeof Audio === "undefined") return Promise.resolve();

  startupSoundPromise = new Promise<void>((resolve) => {
    const audio = new Audio("/audio/film-projector-start.mp3");
    audio.preload = "auto";
    audio.volume = PLAYBACK_VOLUME;
    let fadeFrame: number | undefined;
    let finished = false;
    let stopTimer: number | undefined;

    function finishPlayback() {
      if (finished) return;
      finished = true;
      window.clearTimeout(stopTimer);
      if (fadeFrame !== undefined) window.cancelAnimationFrame(fadeFrame);
      audio.pause();
      audio.volume = PLAYBACK_VOLUME;
      stopCurrentStartupSound = null;
      resolve();
    }

    function scheduleStop() {
      stopTimer = window.setTimeout(() => {
        const fadeStartedAt = performance.now();
        const fadeOut = (now: number) => {
          const progress = Math.min(1, (now - fadeStartedAt) / FADE_DURATION_MS);
          audio.volume = PLAYBACK_VOLUME * (1 - progress);

          if (progress < 1) fadeFrame = window.requestAnimationFrame(fadeOut);
          else finishPlayback();
        };

        fadeFrame = window.requestAnimationFrame(fadeOut);
      }, SEGMENT_DURATION_MS - FADE_DURATION_MS);
    }

    stopCurrentStartupSound = finishPlayback;
    audio.currentTime = START_TIME_SECONDS;
    void audio.play().then(scheduleStop).catch(() => {
      finishPlayback();
    });
    audio.addEventListener("ended", finishPlayback, { once: true });
  });

  return startupSoundPromise;
}

export function stopStartupSound() {
  stopCurrentStartupSound?.();
}
