"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { monthLabel } from "@/lib/format";
import { csvFileName, toCsv } from "@/lib/export";
import { rowsFor, siteOptions } from "@/lib/filter";
import { ALL, PROJECT_TYPES, REGIONS } from "@/lib/types";
import { useDashboard } from "@/state/dashboard";

const TABS = [
  { href: "/", label: "현황 요약" },
  { href: "/compare", label: "현장별 비교" },
  { href: "/import", label: "자료 가져오기" },
  { href: "/ask", label: "AI에게 묻기" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { rows, filter, months, notice, setFilter, resetFilter, clearNotice, showNotice, sourceName } = useDashboard();
  const hasData = !!rows;
  const sites = rows ? siteOptions(rows, filter) : [];

  // 지금 고른 월·지역·유형·현장과 같은 범위를 원본 15개 열 그대로 내려받는다
  function exportCsv() {
    if (!rows) return;
    const scope = rowsFor(rows, filter);
    if (scope.length === 0) {
      showNotice("내보낼 자료가 없습니다. 고른 범위에 해당하는 행이 없습니다.");
      return;
    }
    const blob = new Blob([toCsv(scope)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFileName(filter);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice(`${scope.length}행을 내려받았습니다 (${a.download}).`);
  }

  return (
    <>
      <header className="topbar">
        <span className="brand">현장별 공정·기성 대시보드</span>
        <span className="tag">본사 공무팀 · 교육용 가상 자료</span>
        <nav className="tabs" aria-label="페이지">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={pathname === t.href ? "active" : ""} aria-current={pathname === t.href ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
        <span className="spacer" />
        <span className="basis num">
          {hasData ? `기준: ${monthLabel(filter.month)} (${rows!.length}행)` : "자료 없음"}
        </span>
      </header>
      <div className="filterbar" role="group" aria-label="공통 필터">
        <label>
          기준월
          <select value={filter.month} disabled={!hasData} onChange={(e) => setFilter({ month: e.target.value })}>
            {hasData ? months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>) : <option>—</option>}
          </select>
        </label>
        <label>
          지역
          <select value={filter.region} disabled={!hasData} onChange={(e) => setFilter({ region: e.target.value })}>
            <option value={ALL}>전체 지역</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          공사 유형
          <select value={filter.projectType} disabled={!hasData} onChange={(e) => setFilter({ projectType: e.target.value })}>
            <option value={ALL}>전체 유형</option>
            {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          현장
          <select value={filter.siteId} disabled={!hasData} onChange={(e) => setFilter({ siteId: e.target.value })}>
            <option value={ALL}>전체 현장</option>
            {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteId} · {s.siteName.replace("[가상] ", "")}</option>)}
          </select>
        </label>
        <button className="btn" onClick={resetFilter} disabled={!hasData}>필터 초기화</button>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={exportCsv} disabled={!hasData} title={hasData ? "지금 고른 범위를 원본 15개 열 그대로 내려받습니다" : "자료를 먼저 가져오세요"}>
          CSV 내보내기 (15열)
        </button>
        {sourceName && <span className="current">지금 자료: {sourceName}</span>}
      </div>
      <main className="main">
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button onClick={clearNotice} aria-label="알림 닫기">닫기</button>
          </div>
        )}
        {children}
      </main>
    </>
  );
}
