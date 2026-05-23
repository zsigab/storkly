import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number): string {
  const fixed = value.toFixed(2);
  const dotIndex = fixed.indexOf(".");
  const intPart = fixed.slice(0, dotIndex);
  const decPart = fixed.slice(dotIndex + 1);
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + decPart;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mo}-${dd} ${hh}:${min}`;
}

// JS getTimezoneOffset() is negated vs. UTC+ convention
const LOCAL_OFFSET_SECONDS: number = -new Date().getTimezoneOffset() * 60;

export function applyOffset(iso: string, offsetSeconds: number): Date {
  return new Date(new Date(iso).getTime() + offsetSeconds * 1000);
}

export function formatWithOffset(iso: string, offsetSeconds: number): string {
  const d = applyOffset(iso, offsetSeconds);
  const yyyy = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mo}-${dd} ${hh}:${min}`;
}

export function formatOffsetLabel(offsetSeconds: number): string {
  const sign = offsetSeconds >= 0 ? "+" : "-";
  const abs = Math.abs(offsetSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  return m === 0 ? `GMT${sign}${h}` : `GMT${sign}${h}:${String(m).padStart(2, "0")}`;
}

export function isoOffsetSeconds(iso: string): number {
  if (iso.endsWith("Z") || iso.endsWith("+00:00")) return 0;
  const match = iso.match(/([+-])(\d{2}):(\d{2})$/);
  if (match === null) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  const h = parseInt(match[2] ?? "0", 10);
  const m = parseInt(match[3] ?? "0", 10);
  return sign * (h * 3600 + m * 60);
}

export function toIsoWithTimezone(
  slotDate: string,
  slotTime: string,
  timezone: string,
): { iso: string; offsetSeconds: number } {
  const naiveUtc = new Date(`${slotDate}T${slotTime}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(naiveUtc);

  const getValue = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (part === undefined) return 0;
    const n = parseInt(part.value, 10);
    return isNaN(n) ? 0 : n;
  };

  const rawHour = getValue("hour");
  const hour = rawHour === 24 ? 0 : rawHour;

  const tzMs = Date.UTC(
    getValue("year"),
    getValue("month") - 1,
    getValue("day"),
    hour,
    getValue("minute"),
    getValue("second"),
  );
  const offsetMins = Math.round((tzMs - naiveUtc.getTime()) / 60000);
  const offsetSeconds = offsetMins * 60;

  const sign = offsetMins >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMins);
  const offH = String(Math.floor(abs / 60)).padStart(2, "0");
  const offM = String(abs % 60).padStart(2, "0");

  return { iso: `${slotDate}T${slotTime}:00${sign}${offH}:${offM}`, offsetSeconds };
}

/**
 * Format an event date/time: always shows the persisted timezone first.
 * If the persisted timezone differs from the browser's local, shows local in parentheses.
 * All-day events (null offset, midnight UTC) show only the date.
 */
export function formatEventDate(iso: string, storedOffsetSeconds?: number | null): string {
  if (storedOffsetSeconds == null && iso.endsWith("T00:00:00Z")) {
    return iso.slice(0, 10);
  }

  const persistedOffset = storedOffsetSeconds ?? 0;
  const localOffset = LOCAL_OFFSET_SECONDS;

  const persistedStr = formatWithOffset(iso, persistedOffset);

  if (persistedOffset === localOffset) {
    return persistedStr;
  }

  const localStr = formatWithOffset(iso, localOffset);
  return `${persistedStr} ${formatOffsetLabel(persistedOffset)} (${localStr} ${formatOffsetLabel(localOffset)})`;
}

/**
 * Format a time slot for the attendees table: shows the stored time in the stored timezone.
 * Appends the GMT label only when the stored offset differs from local — no local conversion.
 */
export function formatSlotDate(iso: string, storedOffsetSeconds?: number | null): string {
  const persistedOffset = storedOffsetSeconds ?? 0;
  const str = formatWithOffset(iso, persistedOffset);
  if (persistedOffset === LOCAL_OFFSET_SECONDS) {
    return str;
  }
  return `${str} ${formatOffsetLabel(persistedOffset)}`;
}
