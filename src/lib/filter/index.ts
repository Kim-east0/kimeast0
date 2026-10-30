import { ALL, Filter, SiteRow } from "../types";

export interface SiteOption {
  siteId: string;
  siteName: string;
}

export function matchesScope(r: SiteRow, f: Filter): boolean {
  return (
    (f.region === ALL || r.region === f.region) &&
    (f.projectType === ALL || r.projectType === f.projectType) &&
    (f.siteId === ALL || r.siteId === f.siteId)
  );
}

// 지역·유형 범위 안에 있는 현장 목록(현장 선택 칸에 보여 줄 것)
export function siteOptions(rows: SiteRow[], f: Filter): SiteOption[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    if ((f.region === ALL || r.region === f.region) && (f.projectType === ALL || r.projectType === f.projectType)) {
      map.set(r.siteId, r.siteName);
    }
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([siteId, siteName]) => ({ siteId, siteName }));
}

export function rowsFor(rows: SiteRow[], f: Filter, month: string = f.month): SiteRow[] {
  return rows.filter((r) => r.month === month && matchesScope(r, f)).sort((a, b) => a.siteId.localeCompare(b.siteId));
}

// 지역·유형을 바꿔 선택 현장이 범위에서 빠지면 현장 선택을 전체로 되돌린다
export function normalizeFilter(rows: SiteRow[], f: Filter): { filter: Filter; siteReset: boolean } {
  if (f.siteId === ALL) return { filter: f, siteReset: false };
  const ok = siteOptions(rows, f).some((s) => s.siteId === f.siteId);
  return ok ? { filter: f, siteReset: false } : { filter: { ...f, siteId: ALL }, siteReset: true };
}
