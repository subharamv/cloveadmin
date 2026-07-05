export function formatDuration(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalMinutes = Math.floor(clamped / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function elapsedSince(iso: string, now: Date): string {
  if (!iso) return '—';
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return '—';
  return formatDuration(now.getTime() - start);
}

export function durationBetween(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return '—';
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return '—';
  return formatDuration(end - start);
}
