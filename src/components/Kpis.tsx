import type { Summary } from "@/lib/calc";
import { intComma, money, NA, num1, pct, pp } from "@/lib/format";

export function Kpis({ s }: { s: Summary }) {
  return (
    <section className="kpis" aria-label="큰 숫자">
      <div className="card kpi">
        <div className="label">누적 기성률</div>
        <div className={`big${s.rate === null ? " na" : ""}`}>{pct(s.rate)}</div>
        <div className="rows">
          <div><span>계약금액</span><span className="num">{s.siteCount ? `${intComma(s.contract)} 백만원` : NA}</span></div>
          <div><span>누적기성액</span><span className="num">{s.siteCount ? `${num1(s.earned)} 백만원` : NA}</span></div>
        </div>
      </div>
      <div className="card kpi">
        <div className="label">당월 기성액</div>
        <div className={`big${s.monthly === null ? " na" : ""}`}>
          {money(s.monthly)}
          {s.monthly !== null && <span className="unit">백만원</span>}
        </div>
        <div className="rows">
          <div>
            <span>{s.monthly === null ? "전월 자료가 없어 계산할 수 없습니다" : "이번 달 누적 − 전월 누적"}</span>
          </div>
        </div>
      </div>
      <div className="card kpi">
        <div className="label">공정차이 (실제 − 계획)</div>
        <div className={`big${s.gap === null ? " na" : ""}`}>{pp(s.gap)}</div>
        <div className="rows">
          <div><span>계획 공정률</span><span className="num">{pct(s.planned)}</span></div>
          <div><span>실제 공정률</span><span className="num">{pct(s.actual)}</span></div>
        </div>
      </div>
      <div className="card kpi">
        <div className="label">상태별 현장 수 {s.siteCount ? `(총 ${s.siteCount}곳)` : ""}</div>
        <div className="counts">
          <div className="st-정상"><span className="n">{s.siteCount ? s.counts.정상 : "-"}</span><span className="s">정상</span></div>
          <div className="st-주의"><span className="n">{s.siteCount ? s.counts.주의 : "-"}</span><span className="s">주의</span></div>
          <div className="st-점검"><span className="n">{s.siteCount ? s.counts.점검 : "-"}</span><span className="s">점검</span></div>
        </div>
        <div className="caption" style={{ marginTop: 8 }}>공정차이 0pp 이상 정상 · -5pp 초과 0pp 미만 주의 · -5pp 이하 점검</div>
      </div>
    </section>
  );
}
