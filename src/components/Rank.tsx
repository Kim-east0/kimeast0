import type { SiteMetrics } from "@/lib/calc";
import { pct, pp } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

// 점검 순위. 한 줄을 누르면 현장별 비교표로 이동해 그 현장의 기록을 펼친다
export function Rank({ ranked, onPick }: { ranked: SiteMetrics[]; onPick: (siteId: string) => void }) {
  return (
    <section className="card" aria-label="점검 순위">
      <h2>점검이 필요한 현장 순위</h2>
      <div className="caption">공정차이 -5pp 이하 · 차이가 작은 순, 같으면 현장 ID 순 · 한 줄을 누르면 비교표에서 기록을 봅니다</div>
      {ranked.length === 0 ? (
        <div className="rank-empty" role="status">
          <strong>점검 대상 없음</strong>
          <span>고른 범위에는 공정차이 -5pp 이하인 현장이 없습니다.</span>
        </div>
      ) : (
        <ol className="rank-list">
          {ranked.map((s, i) => (
            <li key={s.row.siteId}>
              <button className="rank-row" onClick={() => onPick(s.row.siteId)} aria-label={`${s.row.siteId} 현장 기록을 비교표에서 보기`}>
                <span className="rank-no num">{i + 1}</span>
                <span className="rank-name">
                  <strong>[{s.row.siteId}]</strong> {s.row.siteName.replace("[가상] ", "")}
                  <span className="caption"> · {s.row.region} · {s.row.projectType}</span>
                </span>
                <StatusBadge status={s.status} gap={s.gap} />
                <span className="rank-figs num">
                  <span>계획 {pct(s.row.plannedProgress)}</span>
                  <span>실제 {pct(s.row.actualProgress)}</span>
                  <span className="gap-neg">차이 {pp(s.gap)}</span>
                  <span>기성률 {pct(s.rate)}</span>
                </span>
                <span className="rank-go">비교표에서 기록 보기 ›</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
