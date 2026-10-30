import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseFileText } from "@/lib/parse";
import { parseCsvText } from "@/lib/parse/csv";
import { validateParsed } from "@/lib/validate";
import { rankInspection, siteMetrics, summarize } from "@/lib/calc";
import { rowsFor } from "@/lib/filter";
import { csvFileName, toCsv } from "@/lib/export";
import { ALL, FIELDS, Filter, SiteRow } from "@/lib/types";
import { Rank } from "@/components/Rank";

const dataDir = path.resolve(__dirname, "../data");
const original = readFileSync(path.join(dataDir, "현장공정기성.csv"), "utf-8");
const rows: SiteRow[] = validateParsed(parseFileText("a.csv", original)).rows;
const F = (o: Partial<Filter> = {}): Filter => ({ month: "2026-09", region: ALL, projectType: ALL, siteId: ALL, ...o });

describe("점검 순위", () => {
  it("9월 전체: D → I → K", () => {
    const r = rankInspection(summarize(rowsFor(rows, F()), rows).sites);
    expect(r.map((s) => s.row.siteId)).toEqual(["D", "I", "K"]);
  });
  it("공정차이가 같으면 현장 ID 순", () => {
    const base = rows.find((r) => r.month === "2026-09" && r.siteId === "D")!;
    const mk = (id: string, planned: number, actual: number) => siteMetrics({ ...base, siteId: id, plannedProgress: planned, actualProgress: actual }, undefined);
    const ranked = rankInspection([mk("K", 80, 70), mk("B", 80, 70), mk("C", 80, 75), mk("A", 80, 60)]);
    // A(-20) → 같은 -10은 현장 ID 순 B, K → 정확히 -5인 C도 점검
    expect(ranked.map((s) => s.row.siteId)).toEqual(["A", "B", "K", "C"]);
  });
  it("정확히 -5pp는 점검에 포함", () => {
    const base = rows[0];
    expect(rankInspection([siteMetrics({ ...base, plannedProgress: 70, actualProgress: 65 }, undefined)])).toHaveLength(1);
    expect(rankInspection([siteMetrics({ ...base, plannedProgress: 70, actualProgress: 65.1 }, undefined)])).toHaveLength(0);
  });
  it("점검 대상이 없는 범위(A만)는 점검 대상 없음 표시", () => {
    const sites = summarize(rowsFor(rows, F({ siteId: "A" })), rows).sites;
    const html = renderToStaticMarkup(<Rank ranked={rankInspection(sites)} onPick={() => {}} />);
    expect(html).toContain("점검 대상 없음");
  });
  it("순위 한 줄에 계획·실제·차이·기성률 (D)", () => {
    const html = renderToStaticMarkup(<Rank ranked={rankInspection(summarize(rowsFor(rows, F()), rows).sites)} onPick={() => {}} />);
    for (const t of ["계획 86.5%", "실제 75.8%", "차이 -10.7pp", "기성률 69.4%", "점검 (-10.7pp)", "점검 (-7.6pp)", "점검 (-5.4pp)"]) expect(html, t).toContain(t);
    expect(html.indexOf("[D]")).toBeLessThan(html.indexOf("[I]"));
    expect(html.indexOf("[I]")).toBeLessThan(html.indexOf("[K]"));
  });
});

describe("CSV 내보내기", () => {
  const out = (f: Filter) => parseCsvText(toCsv(rowsFor(rows, f)));
  it("UTF-8 BOM으로 시작하고 15개 열 헤더", () => {
    const text = toCsv(rowsFor(rows, F()));
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(out(F())[0]).toEqual([...FIELDS]);
  });
  it("9월 D만 → 헤더 + 1행", () => {
    const t = out(F({ siteId: "D" }));
    expect(t).toHaveLength(2);
    expect(t[1][1]).toBe("D");
    expect(t[1][0]).toBe("2026-09");
  });
  it("9월 인천·공동주택 → 헤더 + 2행(A·G)", () => {
    const t = out(F({ region: "인천", projectType: "공동주택" }));
    expect(t).toHaveLength(3);
    expect(t.slice(1).map((r) => r[1])).toEqual(["A", "G"]);
  });
  it("9월 전체 → 12행, 계산 열은 없음", () => {
    const t = out(F());
    expect(t).toHaveLength(13);
    expect(t[0]).toHaveLength(15);
    expect(t[0]).not.toContain("기성률");
  });
  it("원본 값과 같다 (다시 읽으면 144행·같은 자료)", () => {
    const again = validateParsed(parseFileText("again.csv", toCsv(rows)));
    expect(again.errors).toEqual([]);
    expect(again.rows).toEqual(rows);
  });
  it("쉼표·따옴표·줄바꿈이 있는 글자도 깨지지 않음", () => {
    const tricky: SiteRow = { ...rows[0], issueSummary: '쉼표, 따옴표 " 그리고\n줄바꿈' };
    const t = parseCsvText(toCsv([tricky]));
    expect(t[1][13]).toBe(tricky.issueSummary);
  });
  it("범위에 행이 없으면 데이터 0행", () => {
    expect(rowsFor(rows, F({ region: "인천", projectType: "생산시설" }))).toHaveLength(0);
  });
  it("파일 이름에 범위가 들어감", () => {
    expect(csvFileName(F({ siteId: "D" }))).toBe("현장공정기성_2026-09_전체_전체_현장D.csv");
  });
});
