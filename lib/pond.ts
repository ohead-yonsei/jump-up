/** 연잎 한 장: a photo a cohort member chooses to float on the cohort's shared pond. Members see photos and days only,
 * never who floated them, how many anyone has, or any reactions. */

/** The device sends a square JPEG this wide; the server takes a little more than that and nothing larger. */
export const PAD_SIDE = 800;
export const MAX_PAD_SIDE = 2048;
export const MAX_PAD_BYTES = 1_000_000;
/** Enough for a photo most days of a long cohort, and a ceiling on what one person can store. */
export const MAX_PADS_PER_PERSON = 60;
/** The photo missions that end with a picture worth floating. */
export const PAD_MISSIONS = ['outside-snapshot', 'connect-photochat'];

export type Pad = { id: string; cohortId: string; participantId: string; at: string; hidden: boolean };
/** What a member sees of one pad. `hidden` is only ever true on their own pad, after an operator took it down. */
export type PadView = { id: string; at: string; mine: boolean; hidden: boolean };

const newestFirst = (a: Pad, b: Pad) => a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
/** A cohort's pads as one member sees them: everything floating, plus their own pads an operator took down. */
export function padsFor(pads: Pad[], participantId: string): PadView[] {
  return pads.filter(p => !p.hidden || p.participantId === participantId).sort(newestFirst)
    .map(p => ({ id: p.id, at: p.at, mine: p.participantId === participantId, hidden: p.hidden }));
}
/** Members may open a pad's photo when it is in their own cohort and either floating or their own. */
export const canOpenPad = (pad: Pad, viewer: { id: string; cohortId: string }) => pad.cohortId === viewer.cohortId && (!pad.hidden || pad.participantId === viewer.id);
export const validPadId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** A steady look for each pad from its id: where the notch points, a slight tilt and size, so the pond never reshuffles. */
export function padLook(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  h >>>= 0;
  return { notch: h % 360, tilt: (h >>> 9) % 13 - 6, size: 92 + (h >>> 14) % 9, rise: (h >>> 19) % 15 - 7 };
}

const sig = (bytes: Uint8Array, at: number, text: string) => [...text].every((ch, k) => bytes[at + k] === ch.charCodeAt(0));
/** Start-of-frame markers carry the picture's size (C4 DHT, C8 JPG and CC DAC sit in the same range but are not frames). */
const isFrame = (m: number) => m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
/** Only what is needed to draw the picture stays: JFIF, a colour profile and Adobe's colour flag. EXIF (with GPS), XMP, IPTC,
 * maker notes, multi-picture data and comments all go. */
function keepSegment(marker: number, bytes: Uint8Array, at: number) {
  if (marker === 0xfe) return false;
  if (marker < 0xe0 || marker > 0xef) return true;
  if (marker === 0xe0) return sig(bytes, at + 4, 'JFIF\0');
  if (marker === 0xe2) return sig(bytes, at + 4, 'ICC_PROFILE\0');
  if (marker === 0xee) return sig(bytes, at + 4, 'Adobe');
  return false;
}
/** Rewrites a JPEG without its metadata, and stops at the first end-of-image so nothing appended after it (such as a
 * second picture with its own EXIF) survives. Anything that is not a whole JPEG of a sensible size is refused with null.
 * The device already redraws the photo, which drops metadata; this makes sure of it on the server. */
export function cleanJpeg(input: Uint8Array): { bytes: Uint8Array; width: number; height: number } | null {
  const n = input.length;
  if (n < 4 || n > MAX_PAD_BYTES || input[0] !== 0xff || input[1] !== 0xd8) return null;
  const parts: Uint8Array[] = [input.subarray(0, 2)];
  let i = 2, width = 0, height = 0, scans = 0;
  for (;;) {
    if (i >= n || input[i] !== 0xff) return null;
    while (i < n && input[i] === 0xff) i++;
    if (i >= n) return null;
    const marker = input[i++];
    if (marker === 0xd9) {
      if (!scans) return null;
      parts.push(Uint8Array.of(0xff, 0xd9));
      break;
    }
    // Restart and other stand-alone markers only belong inside scan data.
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) return null;
    if (i + 2 > n) return null;
    const length = (input[i] << 8) | input[i + 1];
    if (length < 2 || i + length > n) return null;
    if (isFrame(marker)) {
      if (length < 8) return null;
      height = (input[i + 3] << 8) | input[i + 4];
      width = (input[i + 5] << 8) | input[i + 6];
    }
    if (keepSegment(marker, input, i - 2)) parts.push(Uint8Array.of(0xff, marker), input.subarray(i, i + length));
    i += length;
    if (marker === 0xda) {
      if (!width || !height) return null;
      scans++;
      // Scan data runs until a marker that is not a stuffed zero or a restart.
      const start = i;
      while (i < n) {
        if (input[i] === 0xff && i + 1 < n) {
          const next = input[i + 1];
          if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) { i += 2; continue; }
          if (next !== 0xff) break;
        }
        i++;
      }
      if (i >= n - 1) return null;
      parts.push(input.subarray(start, i));
    }
  }
  if (width > MAX_PAD_SIDE || height > MAX_PAD_SIDE) return null;
  const bytes = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let at = 0;
  for (const p of parts) { bytes.set(p, at); at += p.length; }
  return { bytes, width, height };
}
