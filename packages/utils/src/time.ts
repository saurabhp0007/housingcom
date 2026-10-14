const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact relative time for inbox rows: "now", "5m", "3h", "Yesterday", "Mon", "12 Mar". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diff = now.getTime() - then.getTime();
  if (diff < MINUTE) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY && then.getDate() === now.getDate()) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return then.toLocaleDateString('en-IN', { weekday: 'short' });
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** "10:42 am" for chat bubbles. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
