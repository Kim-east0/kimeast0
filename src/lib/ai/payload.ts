import { summarize, trendUntil, type Summary } from "../calc";
import { matchesScope, rowsFor } from "../filter";
import { round1 } from "../format";
import { ALL, type Filter, type SiteRow } from "../types";

export const MAX_QUESTION = 500;

const NA = "계산 불가";
const r1 = (n: number | null): number | string => (n === null ? NA : round1(n));

export interface AiScope {
  month: string;
  region: string;
  projectType: string;
  siteId: string;
  siteIds: string[];
  siteCount: number;
  monthRange: [string, string];
}

export interface AiPayload {
  scope: AiScope;
  // 현장이 기록한 원문(선택 월의 원문 행). 프로그램이 계산한 값이 아님
  records: SiteRow[];
  // 프로그램이 계산한 지표
  computed: {
    summary: Record<string, number | string>;
    sites: Record<string, number | string>[];
  };
  // 시작 월~선택 월의 월별 요약(같은 지역·유형·현장 범위)
  trend: Record<string, number | string>[];
  // 현장 한 곳을 골랐을 때만: 그 현장의 월별 기록(선택 월까지)
  siteHistory: Pick<SiteRow, "month" | "currentWork" | "issueCategory" | "issueSummary" | "actionPlan">[] | null;
}

function summaryOf(s: Summary): Record<string, number | string> {
  return {
    현장수: s.siteCount,
    계약금액_백만원: s.contract,
    누적기성액_백만원: r1(s.siteCount ? s.earned : null),
    기성률_퍼센트: r1(s.rate),
    계획공정률_퍼센트: r1(s.planned),
    실제공정률_퍼센트: r1(s.actual),
    공정차이_pp: r1(s.gap),
    당월기성액_백만원: r1(s.monthly),
    정상: s.counts.정상,
    주의: s.counts.주의,
    점검: s.counts.점검,
  };
}

export function buildPayload(allRows: SiteRow[], filter: Filter): AiPayload {
  const records = rowsFor(allRows, filter);
  const summary = summarize(records, allRows);
  const trend = trendUntil(allRows, filter.month, (m) => m.filter((r) => matchesScope(r, filter)));
  const months = trend.map((t) => t.month);
  return {
    scope: {
      month: filter.month,
      region: filter.region,
      projectType: filter.projectType,
      siteId: filter.siteId,
      siteIds: records.map((r) => r.siteId),
      siteCount: records.length,
      monthRange: [months[0] ?? filter.month, months[months.length - 1] ?? filter.month],
    },
    records,
    computed: {
      summary: summaryOf(summary),
      sites: summary.sites.map((s) => ({
        siteId: s.row.siteId,
        공정차이_pp: round1(s.gap),
        상태: s.status,
        기성률_퍼센트: round1(s.rate),
        당월기성액_백만원: r1(s.monthly),
      })),
    },
    trend: trend.map((t) => ({
      month: t.month,
      ...summaryOf(t.summary),
    })),
    siteHistory:
      filter.siteId === ALL
        ? null
        : allRows
            .filter((r) => r.siteId === filter.siteId && r.month <= filter.month && matchesScope(r, filter))
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(({ month, currentWork, issueCategory, issueSummary, actionPlan }) => ({ month, currentWork, issueCategory, issueSummary, actionPlan })),
  };
}

export function scopeKey(f: Filter): string {
  return [f.month, f.region, f.projectType, f.siteId].join("|");
}
