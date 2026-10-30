export const NA = "계산 불가";

// 계산 중에는 반올림하지 않고, 표시할 때만 소수 첫째 자리로 반올림한다.
export function round1(n: number): number {
  const r = Math.round((n + Math.sign(n) * 1e-9) * 10) / 10;
  return r === 0 ? 0 : r;
}

export function num1(n: number | null): string {
  if (n === null) return NA;
  return round1(n).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function pct(n: number | null): string {
  return n === null ? NA : `${num1(n)}%`;
}

export function pp(n: number | null): string {
  if (n === null) return NA;
  const r = round1(n);
  return `${r > 0 ? "+" : ""}${num1(r)}pp`;
}

export function money(n: number | null): string {
  return n === null ? NA : num1(n);
}

export function intComma(n: number): string {
  return n.toLocaleString("en-US");
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
}

export function shortMonth(month: string): string {
  const [y, m] = month.split("-");
  return m === "01" || month === "2025-10" ? `${y.slice(2)}.${m}` : m;
}
