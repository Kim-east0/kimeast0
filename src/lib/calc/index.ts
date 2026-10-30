import { SiteRow, Status } from "../types";

export function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}

// 공정차이는 실제 - 계획(pp). 부동소수점 잡음을 지우고 비교한다.
export function progressGap(r: Pick<SiteRow, "plannedProgress" | "actualProgress">): number {
  return Math.round((r.actualProgress - r.plannedProgress) * 1e9) / 1e9;
}

export function statusOf(gap: number): Status {
  const g = Math.round(gap * 1e9) / 1e9;
  if (g >= 0) return "정상";
  if (g > -5) return "주의";
  return "점검";
}

export interface SiteMetrics {
  row: SiteRow;
  gap: number;
  status: Status;
  rate: number; // 기성률 %
  monthly: number | null; // 당월기성액. 전월이 없으면 null
}

export function siteMetrics(row: SiteRow, prev: SiteRow | undefined): SiteMetrics {
  const gap = progressGap(row);
  return {
    row,
    gap,
    status: statusOf(gap),
    rate: (row.cumulativeEarned / row.contractAmount) * 100,
    monthly: prev ? row.cumulativeEarned - prev.cumulativeEarned : null,
  };
}

export interface Summary {
  siteCount: number;
  contract: number;
  earned: number;
  rate: number | null;
  planned: number | null;
  actual: number | null;
  gap: number | null;
  monthly: number | null;
  counts: Record<Status, number>;
  sites: SiteMetrics[];
}

// rows: 선택 월의 (필터가 적용된) 행. allRows: 전체 자료(전월 값을 찾기 위해)
export function summarize(rows: SiteRow[], allRows: SiteRow[]): Summary {
  const counts: Record<Status, number> = { 정상: 0, 주의: 0, 점검: 0 };
  if (rows.length === 0) {
    return { siteCount: 0, contract: 0, earned: 0, rate: null, planned: null, actual: null, gap: null, monthly: null, counts, sites: [] };
  }
  const month = rows[0].month;
  const prevKey = prevMonth(month);
  const prevBySite = new Map(allRows.filter((r) => r.month === prevKey).map((r) => [r.siteId, r]));
  const sites = rows.map((r) => siteMetrics(r, prevBySite.get(r.siteId)));
  let contract = 0;
  let earned = 0;
  let plannedW = 0;
  let actualW = 0;
  for (const s of sites) {
    contract += s.row.contractAmount;
    earned += s.row.cumulativeEarned;
    plannedW += s.row.contractAmount * s.row.plannedProgress;
    actualW += s.row.contractAmount * s.row.actualProgress;
    counts[s.status]++;
  }
  const planned = plannedW / contract;
  const actual = actualW / contract;
  // 선택 현장 모두에 전월 값이 있을 때만 당월기성액을 합산한다
  const monthly = sites.every((s) => s.monthly !== null) ? sites.reduce((sum, s) => sum + (s.monthly as number), 0) : null;
  return {
    siteCount: sites.length,
    contract,
    earned,
    rate: (earned / contract) * 100,
    planned,
    actual,
    gap: actual - planned,
    monthly,
    counts,
    sites,
  };
}

export interface TrendPoint {
  month: string;
  summary: Summary;
}

export function allMonths(rows: SiteRow[]): string[] {
  return [...new Set(rows.map((r) => r.month))].sort();
}

// 시작 월부터 선택 월까지 매월 같은 필터로 따로 집계한다(월별 누적액을 합산하지 않는다)
export function trendUntil(
  allRows: SiteRow[],
  month: string,
  pick: (monthRows: SiteRow[]) => SiteRow[],
): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (const m of allMonths(allRows)) {
    if (m > month) break;
    const monthRows = pick(allRows.filter((r) => r.month === m));
    if (monthRows.length === 0) continue;
    points.push({ month: m, summary: summarize(monthRows, allRows) });
  }
  return points;
}

// 점검 순위: 점검 상태 현장만, 공정차이 오름차순, 같으면 siteId 오름차순
export function rankInspection(sites: SiteMetrics[]): SiteMetrics[] {
  return sites
    .filter((s) => s.status === "점검")
    .sort((a, b) => a.gap - b.gap || a.row.siteId.localeCompare(b.row.siteId));
}
