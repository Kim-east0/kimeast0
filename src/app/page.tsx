"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { rankInspection, summarize, trendUntil } from "@/lib/calc";
import { matchesScope, rowsFor } from "@/lib/filter";
import { monthLabel } from "@/lib/format";
import { useDashboard } from "@/state/dashboard";
import { EmptyData } from "@/components/EmptyData";
import { Kpis } from "@/components/Kpis";
import { Rank } from "@/components/Rank";
import { SiteGrid } from "@/components/SiteGrid";
import { MonthlyBars, TrendChart } from "@/components/Charts";

export default function OverviewPage() {
  const { rows, filter, setFocus } = useDashboard();
  const router = useRouter();

  const { summary, trend } = useMemo(() => {
    if (!rows) return { summary: null, trend: [] };
    return {
      summary: summarize(rowsFor(rows, filter), rows),
      trend: trendUntil(rows, filter.month, (monthRows) => monthRows.filter((r) => matchesScope(r, filter))),
    };
  }, [rows, filter]);

  if (!rows || !summary) return <EmptyData />;

  // 점검 현장 한 줄을 누르면 비교표로 가서 그 현장 줄을 강조하고 기록을 펼친다(필터는 그대로)
  const goCompare = (siteId: string) => {
    setFocus(siteId);
    router.push("/compare");
  };

  return (
    <>
      <div className="page-title">
        <h1>현황 요약</h1>
        <span className="sub">{monthLabel(filter.month)} 기준 · 교육용 가상 자료</span>
      </div>
      {summary.siteCount === 0 ? (
        <div className="card empty" role="status">
          <h2>자료 없음</h2>
          <p>고른 범위에 해당하는 현장이 없습니다. 계산할 수 없어 0%로 표시하지 않습니다.</p>
        </div>
      ) : (
        <>
          <Kpis s={summary} />
          <SiteGrid sites={summary.sites} onPick={goCompare} />
          <Rank ranked={rankInspection(summary.sites)} onPick={goCompare} />
        </>
      )}
      <div className="charts">
        <TrendChart points={trend} />
        <MonthlyBars points={trend} />
      </div>
    </>
  );
}
