/**
 * Low-latency sound effects. HTMLAudioElement.play() can lag noticeably (especially on
 * iOS) and can't overlap itself, so effects are decoded up front and played through
 * Web Audio, skipping any silence at the start of the file.
 */

const SILENCE_THRESHOLD = 0.01;

type Sound = { buffer: AudioBuffer; offset: number };

let context: AudioContext | undefined;
const sounds = new Map<string, Promise<Sound | undefined>>();

function getContext() {
  if (!context && typeof window !== "undefined" && window.AudioContext) {
    context = new AudioContext();
    // Browsers start the context suspended until a user gesture; resume on the first
    // one so the first effect isn't held up waiting for it
    const unlock = () => {
      context?.resume().catch(() => {});
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
  }
  return context;
}

function firstAudibleSample(buffer: AudioBuffer) {
  let first = buffer.length;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < first; i++) {
      if (Math.abs(data[i]) > SILENCE_THRESHOLD) {
        first = i;
        break;
      }
    }
  }
  return first === buffer.length ? 0 : first / buffer.sampleRate;
}

/** Fetch and decode a sound ahead of time. Safe to call repeatedly. */
export function preloadSound(url: string) {
  const ctx = getContext();
  if (!ctx) return;
  if (!sounds.has(url)) {
    sounds.set(
      url,
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => ({ buffer, offset: firstAudibleSample(buffer) }))
        .catch((error) => {
          console.error(`Failed to load sound ${url}:`, error);
          return undefined;
        }),
    );
  }
}

export function playSound(url: string) {
  const ctx = getContext();
  if (!ctx) return;
  preloadSound(url);
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  sounds.get(url)?.then((sound) => {
    if (!sound) return;
    const source = ctx.createBufferSource();
    source.buffer = sound.buffer;
    source.connect(ctx.destination);
    source.start(0, sound.offset);
  });
}
