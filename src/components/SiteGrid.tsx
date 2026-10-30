import type { SiteMetrics } from "@/lib/calc";
import { pct, pp } from "@/lib/format";
import { gapClass, StatusBadge } from "./StatusBadge";

export function SiteGrid({ sites, onPick }: { sites: SiteMetrics[]; onPick?: (siteId: string) => void }) {
  return (
    <section className="card" aria-label="현장 비교 목록">
      <h2>{sites.length}개 현장 비교</h2>
      <div className="caption">현장 ID 순 · 계획·실제 공정률, 공정차이, 기성률{onPick ? " · 카드를 누르면 비교표에서 기록을 봅니다" : ""}</div>
      <div className="site-grid">
        {sites.map((s) => {
          const body = (
            <>
              <div className="head">
                <span className="name">[{s.row.siteId}] {s.row.siteName.replace("[가상] ", "")}</span>
                <StatusBadge status={s.status} gap={s.gap} />
              </div>
              <div className="meta">{s.row.region} · {s.row.projectType}</div>
              <dl className="num">
                <div><dt>계획</dt><dd>{pct(s.row.plannedProgress)}</dd></div>
                <div><dt>실제</dt><dd>{pct(s.row.actualProgress)}</dd></div>
                <div><dt>차이</dt><dd className={gapClass(s.status)}>{pp(s.gap)}</dd></div>
                <div><dt>기성률</dt><dd>{pct(s.rate)}</dd></div>
              </dl>
            </>
          );
          return onPick ? (
            <button key={s.row.siteId} className={`site clickable ${s.status}`} onClick={() => onPick(s.row.siteId)} aria-label={`${s.row.siteId} 현장 기록을 비교표에서 보기`}>
              {body}
            </button>
          ) : (
            <article key={s.row.siteId} className={`site ${s.status}`}>{body}</article>
          );
        })}
      </div>
    </section>
  );
}
