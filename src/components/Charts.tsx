import type { TrendPoint } from "@/lib/calc";
import { monthLabel, NA, num1, pct, pp, shortMonth } from "@/lib/format";

const W = 560;
const H = 260;
const PAD = { l: 44, r: 16, t: 16, b: 28 };

function xAt(i: number, n: number): number {
  return n <= 1 ? PAD.l + (W - PAD.l - PAD.r) / 2 : PAD.l + (i * (W - PAD.l - PAD.r)) / (n - 1);
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const last = points[points.length - 1];
  const yOf = (v: number) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);
  const line = (pick: (p: TrendPoint) => number | null) =>
    points
      .map((p, i) => ({ v: pick(p), i }))
      .filter((d): d is { v: number; i: number } => d.v !== null)
      .map((d, k) => `${k === 0 ? "M" : "L"}${xAt(d.i, points.length).toFixed(1)},${yOf(d.v).toFixed(1)}`)
      .join(" ");

  return (
    <section className="card" aria-label="누적 공정률 추이">
      <div className="chart-head">
        <div>
          <h2>누적 공정률 추이</h2>
          <div className="caption">
            {points.length > 0 ? `${monthLabel(points[0].month)} ~ ${monthLabel(last.month)} · 월말 누적 %` : "자료 없음"}
          </div>
        </div>
        <div className="legend">
          <span><i style={{ borderColor: "#94a3b8", borderTopStyle: "dashed" }} />계획</span>
          <span><i style={{ borderColor: "#2563eb" }} />실제</span>
        </div>
      </div>
      {points.length === 0 ? (
        <p className="caption">{NA}</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`계획 ${pct(last.summary.planned)}, 실제 ${pct(last.summary.actual)}`}>
            {[0, 20, 40, 60, 80, 100].map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} stroke="#e2e8f0" />
                <text x={PAD.l - 6} y={yOf(t) + 4} textAnchor="end">{t}%</text>
              </g>
            ))}
            {points.map((p, i) => (
              <text key={p.month} x={xAt(i, points.length)} y={H - 8} textAnchor="middle">{shortMonth(p.month)}</text>
            ))}
            <path d={line((p) => p.summary.planned)} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" />
            <path d={line((p) => p.summary.actual)} fill="none" stroke="#2563eb" strokeWidth={2.5} />
            {points.map((p, i) => (
              <circle key={p.month} cx={xAt(i, points.length)} cy={yOf(p.summary.actual ?? 0)} r={i === points.length - 1 ? 4 : 2.5} fill="#2563eb" />
            ))}
            <text x={xAt(points.length - 1, points.length)} y={yOf(last.summary.actual ?? 0) - 10} textAnchor="end" style={{ fill: "#dc2626", fontWeight: 700 }}>
              {pp(last.summary.gap)}
            </text>
          </svg>
          <div className="chart-foot num">
            <span>{monthLabel(last.month)} 계획 {pct(last.summary.planned)} vs 실제 {pct(last.summary.actual)}</span>
            <span>공정차이 {pp(last.summary.gap)}</span>
          </div>
        </>
      )}
    </section>
  );
}

export function MonthlyBars({ points }: { points: TrendPoint[] }) {
  const values = points.map((p) => p.summary.monthly).filter((v): v is number => v !== null);
  const max = Math.max(10, ...values);
  const top = Math.ceil(max / 10000) * 10000;
  const yOf = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  const n = points.length;
  const slot = (W - PAD.l - PAD.r) / Math.max(n, 1);
  const bw = Math.min(28, slot * 0.6);
  const last = points[n - 1];

  return (
    <section className="card" aria-label="월별 기성 막대">
      <div className="chart-head">
        <div>
          <h2>월별 당월기성액 (백만원)</h2>
          <div className="caption">당월 누적 − 전월 누적. 누적액을 더한 값이 아닙니다</div>
        </div>
      </div>
      {n === 0 ? (
        <p className="caption">{NA}</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="월별 당월기성액 막대 차트">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={yOf(top * t)} y2={yOf(top * t)} stroke="#e2e8f0" />
                <text x={PAD.l - 6} y={yOf(top * t) + 4} textAnchor="end">{Math.round((top * t) / 1000)}k</text>
              </g>
            ))}
            {points.map((p, i) => {
              const cx = PAD.l + slot * i + slot / 2;
              const v = p.summary.monthly;
              const isLast = i === n - 1;
              return (
                <g key={p.month}>
                  {v === null ? (
                    <text x={cx} y={yOf(0) - 6} textAnchor="middle" style={{ fill: "#64748b" }}>N/A</text>
                  ) : (
                    <>
                      <rect x={cx - bw / 2} y={yOf(v)} width={bw} height={Math.max(yOf(0) - yOf(v), 1)} fill={isLast ? "#1d4ed8" : "#60a5fa"} />
                      {isLast && <text x={cx} y={yOf(v) - 4} textAnchor="middle" style={{ fill: "#1d4ed8", fontWeight: 700 }}>{num1(v)}</text>}
                    </>
                  )}
                  <text x={cx} y={H - 8} textAnchor="middle">{shortMonth(p.month)}</text>
                </g>
              );
            })}
          </svg>
          <div className="chart-foot num">
            <span>{points[0].summary.monthly === null ? `※ ${monthLabel(points[0].month)}은 전월 자료가 없어 당월기성액 ${NA}` : "※ 모든 달 계산됨"}</span>
            <span>{monthLabel(last.month)} 당월기성액 {last.summary.monthly === null ? NA : `${num1(last.summary.monthly)} 백만원`}</span>
          </div>
        </>
      )}
    </section>
  );
}
