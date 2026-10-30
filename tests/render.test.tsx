import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseFileText } from "@/lib/parse";
import { validateParsed } from "@/lib/validate";
import { summarize, trendUntil } from "@/lib/calc";
import { matchesScope, rowsFor } from "@/lib/filter";
import { ALL, Filter, SiteRow } from "@/lib/types";
import { Kpis } from "@/components/Kpis";
import { SiteGrid } from "@/components/SiteGrid";
import { MonthlyBars, TrendChart } from "@/components/Charts";

const dataDir = path.resolve(__dirname, "../data");
const rows: SiteRow[] = validateParsed(parseFileText("a.csv", readFileSync(path.join(dataDir, "현장공정기성.csv"), "utf-8"))).rows;
const F = (o: Partial<Filter> = {}): Filter => ({ month: "2026-09", region: ALL, projectType: ALL, siteId: ALL, ...o });

// 화면 컴포넌트가 실제로 보여 주는 글자를 확인한다(브라우저 대신 서버 렌더링 결과를 읽음)
function screen(f: Filter) {
  const s = summarize(rowsFor(rows, f), rows);
  const t = trendUntil(rows, f.month, (m) => m.filter((r) => matchesScope(r, f)));
  return renderToStaticMarkup(
    <>
      <Kpis s={s} />
      <SiteGrid sites={s.sites} />
      <TrendChart points={t} />
      <MonthlyBars points={t} />
    </>,
  );
}

describe("화면에 보이는 글자", () => {
  it("9월 전체: 큰 숫자·상태 배지", () => {
    const html = screen(F());
    for (const text of ["67.2%", "630,700 백만원", "424,063.4 백만원", "28,878.7", "-2.0pp", "73.2%", "71.2%", "점검 (-10.7pp)", "점검 (-7.6pp)", "점검 (-5.4pp)", "주의 (-3.4pp)", "정상 (+1.7pp)"]) {
      expect(html, text).toContain(text);
    }
    expect((html.match(/class="site /g) ?? []).length).toBe(12);
  });
  it("D 현장 카드 숫자: 계획 86.5%·실제 75.8%·기성률 69.4%", () => {
    const html = screen(F({ siteId: "D" }));
    for (const text of ["86.5%", "75.8%", "69.4%", "-10.7pp", "3,339.6"]) expect(html, text).toContain(text);
  });
  it("2025-10: 당월기성액 계산 불가, 첫 막대는 N/A, 누적 기성률은 표시", () => {
    const html = screen(F({ month: "2025-10" }));
    expect(html).toContain("계산 불가");
    expect(html).toContain("N/A");
    expect(html).toContain("16.7%");
    expect(html).not.toContain("105,449.7 백만원 계산");
  });
  it("J 7월: 당월기성액 0.0 (계산 불가가 아님)", () => {
    const html = renderToStaticMarkup(<Kpis s={summarize(rowsFor(rows, F({ month: "2026-07", siteId: "J" })), rows)} />);
    expect(html).toContain("0.0");
    expect(html).not.toContain("전월 자료가 없어");
  });
  it("범위에 현장이 없으면 0%가 아니라 계산 불가", () => {
    const html = renderToStaticMarkup(<Kpis s={summarize(rowsFor(rows, F({ region: "인천", projectType: "생산시설" })), rows)} />);
    expect(html).toContain("계산 불가");
    expect(html).not.toContain("0.0%");
  });
});
