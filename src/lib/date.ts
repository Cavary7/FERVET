import { DateKey } from "@/lib/types";

const DAY_MS = 86_400_000;

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateKey(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as DateKey;
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addDaysToKey(dateKey: DateKey, amount: number) {
  return toDateKey(addDays(fromDateKey(dateKey), amount));
}

export function eachDayOfInterval(start: Date, end: Date) {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const final = startOfDay(end);

  while (cursor <= final) {
    days.push(cursor);
    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  return days;
}

export function getWeekStart(date = new Date()) {
  const current = startOfDay(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(current, diff);
}

export function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatLongDate(dateKey: DateKey) {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function formatTimeSince(timestamp: string, now: number) {
  const elapsed = Math.max(0, now - new Date(timestamp).getTime());
  const totalSeconds = Math.floor(elapsed / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
    2,
    "0",
  )}m ${String(seconds).padStart(2, "0")}s`;
}

export function daysBetween(start: Date, end: Date) {
  const startDay = startOfDay(start).getTime();
  const endDay = startOfDay(end).getTime();
  return Math.floor((endDay - startDay) / DAY_MS);
}
