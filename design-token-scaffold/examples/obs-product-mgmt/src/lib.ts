export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function pageWindow(current: number, total: number): number[] {
  const from = Math.max(1, Math.min(current - 2, total - 4));
  const to = Math.min(total, Math.max(5, current + 2));
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}
