"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { summarize } from "@/lib/calc";
import { rowsFor } from "@/lib/filter";
import { intComma, monthLabel, num1, pct, pp } from "@/lib/format";
import { useDashboard } from "@/state/dashboard";
import { EmptyData } from "@/components/EmptyData";
import { RecordDetail } from "@/components/RecordDetail";
import { gapClass, StatusBadge } from "@/components/StatusBadge";

export default function ComparePage() {
  const { rows, filter, focusSiteId, setFocus } = useDashboard();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const summary = useMemo(() => (rows ? summarize(rowsFor(rows, filter), rows) : null), [rows, filter]);

  // 점검 순위에서 넘어온 현장은 줄을 펼치고 화면 가운데로 가져온다
  useEffect(() => {
    if (!focusSiteId) return;
    setExpanded((prev) => new Set(prev).add(focusSiteId));
    const el = document.getElementById(`site-row-${focusSiteId}`);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center" });
  }, [focusSiteId, summary]);

  if (!rows || !summary) {
    return (
      <>
        <div className="page-title"><h1>현장별 비교표</h1></div>
        <EmptyData />
      </>
    );
  }

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const collapseAll = () => {
    setExpanded(new Set());
    setFocus(null);
  };

  return (
    <>
      <div className="page-title">
        <h1>현장별 비교표</h1>
        <span className="sub">{monthLabel(filter.month)} 기준 · 줄을 누르면 기록이 펼쳐집니다</span>
      </div>

      {summary.siteCount === 0 ? (
        <div className="card empty" role="status">
          <h2>자료 없음</h2>
          <p>고른 범위에 해당하는 현장이 없습니다. 계산할 수 없어 0%로 표시하지 않습니다.</p>
        </div>
      ) : (
        <section className="card" aria-label="현장별 비교표">
          <div className="table-head">
            <div className="legend">
              <span className="badge st-정상">정상 0pp 이상</span>
              <span className="badge st-주의">주의 -5pp 초과 0pp 미만</span>
              <span className="badge st-점검">점검 -5pp 이하</span>
            </div>
            <button className="btn" onClick={collapseAll} disabled={expanded.size === 0}>모두 접기</button>
          </div>
          <div className="table-wrap">
            <table className="compare">
              <thead>
                <tr>
                  <th aria-label="펼침" />
                  <th>현장 ID</th><th>현장명</th><th>지역</th><th>공사 유형</th><th>당월 주요 공종</th>
                  <th className="r">계약금액(백만원)</th><th className="r">누적기성액(백만원)</th><th className="r">기성률</th>
                  <th className="r">계획공정률</th><th className="r">실제공정률</th><th className="r">공정차이</th><th>상태</th>
                </tr>
              </thead>
              <tbody>
                {summary.sites.map((s) => {
                  const r = s.row;
                  const open = expanded.has(r.siteId);
                  const focused = focusSiteId === r.siteId;
                  return (
                    <Fragment key={r.siteId}>
                      <tr
                        id={`site-row-${r.siteId}`}
                        className={`data-row${focused ? " focused" : ""}${s.status === "점검" ? " bad" : ""}`}
                        onClick={() => toggle(r.siteId)}
                      >
                        <td>
                          <button
                            className="chev"
                            aria-expanded={open}
                            aria-label={`${r.siteId} 기록 ${open ? "접기" : "펼치기"}`}
                            onClick={(e) => { e.stopPropagation(); toggle(r.siteId); }}
                          >{open ? "▾" : "▸"}</button>
                        </td>
                        <td className="num"><strong>{r.siteId}</strong></td>
                        <td>{r.siteName}</td>
                        <td>{r.region}</td>
                        <td>{r.projectType}</td>
                        <td>{r.currentWork}</td>
                        <td className="r num">{intComma(r.contractAmount)}</td>
                        <td className="r num">{num1(r.cumulativeEarned)}</td>
                        <td className="r num">{pct(s.rate)}</td>
                        <td className="r num">{pct(r.plannedProgress)}</td>
                        <td className="r num">{pct(r.actualProgress)}</td>
                        <td className={`r num ${gapClass(s.status)}`}>{pp(s.gap)}</td>
                        <td><StatusBadge status={s.status} gap={s.gap} /></td>
                      </tr>
                      {open && (
                        <tr className="detail-row">
                          <td colSpan={13}>
                            <RecordDetail r={r} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td colSpan={5}><strong>합계·가중평균 ({summary.siteCount}개 현장)</strong></td>
                  <td className="r num">{intComma(summary.contract)}</td>
                  <td className="r num">{num1(summary.earned)}</td>
                  <td className="r num">{pct(summary.rate)}</td>
                  <td className="r num">{pct(summary.planned)}</td>
                  <td className="r num">{pct(summary.actual)}</td>
                  <td className="r num">{pp(summary.gap)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
