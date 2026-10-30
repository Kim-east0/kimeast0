import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseFileText } from "@/lib/parse";
import { validateParsed } from "@/lib/validate";
import { prevMonth, statusOf, summarize, trendUntil } from "@/lib/calc";
import { normalizeFilter, rowsFor, siteOptions } from "@/lib/filter";
import { num1, pct, pp, round1 } from "@/lib/format";
import { ALL, Filter, SiteRow } from "@/lib/types";

const dataDir = path.resolve(__dirname, "../data");
const read = (p: string) => readFileSync(path.join(dataDir, p), "utf-8");

function load(file: string) {
  return validateParsed(parseFileText(file.split("/").pop()!, read(file)));
}

const csv = load("현장공정기성.csv");
const json = load("현장공정기성.json");
const rows: SiteRow[] = csv.rows;
const F = (over: Partial<Filter> = {}): Filter => ({ month: "2026-09", region: ALL, projectType: ALL, siteId: ALL, ...over });
const sum = (f: Filter) => summarize(rowsFor(rows, f), rows);

describe("가져오기 검사", () => {
  it("정상 CSV는 144행·오류 없음", () => {
    expect(csv.errors).toEqual([]);
    expect(csv.rows).toHaveLength(144);
  });
  it("정상 JSON은 144행이고 CSV와 같은 자료", () => {
    expect(json.errors).toEqual([]);
    expect(json.rows).toHaveLength(144);
    expect(json.rows).toEqual(csv.rows);
  });
  it("오류_중복키.csv 거부 (파일 146행)", () => {
    const r = load("검증용_오류데이터/오류_중복키.csv");
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0].message).toContain("파일 146행");
    expect(r.errors[0].message).toContain("2026-09 / D");
    expect(r.errors[0].message).toContain("중복");
  });
  it("오류_공정률101.csv 거부 (파일 134행)", () => {
    const r = load("검증용_오류데이터/오류_공정률101.csv");
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0].message).toContain("파일 134행");
    expect(r.errors[0].message).toContain("actualProgress 101");
  });
  it("오류_공정률빈값.csv 거부, 0으로 바꾸지 않음", () => {
    const r = load("검증용_오류데이터/오류_공정률빈값.csv");
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0].message).toContain("파일 134행");
    expect(r.errors[0].message).toContain("비어 있습니다");
  });
  it("CSV·JSON이 아니면 거부", () => {
    expect(() => parseFileText("a.xlsx", "x")).toThrow("CSV 또는 JSON");
  });
  it("계약금액 0, 공정률 감소, 현장 정보 불일치를 거부", () => {
    const lines = read("현장공정기성.csv").split(/\r?\n/);
    const header = lines[0];
    const zero = [header, lines[1].replace("86400", "0")].join("\n");
    expect(validateParsed(parseFileText("a.csv", zero)).errors[0].message).toContain("contractAmount");
  });
  it("JSON metadata 단위가 다르면 거부", () => {
    const obj = JSON.parse(read("현장공정기성.json"));
    obj.metadata.moneyUnit = "원";
    const r = validateParsed(parseFileText("a.json", JSON.stringify(obj)));
    expect(r.errors[0].message).toContain("moneyUnit");
  });
  it("월 누락은 경고만 하고 반영 가능", () => {
    const obj = JSON.parse(read("현장공정기성.json"));
    obj.records = obj.records.filter((x: SiteRow) => !(x.month === "2026-03" && x.siteId === "B"));
    const r = validateParsed(parseFileText("a.json", JSON.stringify(obj)));
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.rows).toHaveLength(143);
  });
});

describe("상태 판정", () => {
  it("경계값: 70/70 정상, 65.1 주의, 65 점검", () => {
    expect(statusOf(70 - 70)).toBe("정상");
    expect(statusOf(65.1 - 70)).toBe("주의");
    expect(statusOf(65 - 70)).toBe("점검");
  });
});

describe("검산표 — 월별 전체 현장", () => {
  // 월, 누적기성액, 기성률, 계획, 실제, 공정차이, 당월기성액, 정상, 주의, 점검
  const table: [string, number, number, number, number, number, number | null, number, number, number][] = [
    ["2025-10", 105449.7, 16.7, 19.4, 19.6, 0.2, null, 10, 2, 0],
    ["2025-11", 125857.8, 20.0, 22.8, 23.2, 0.3, 20408.1, 10, 2, 0],
    ["2025-12", 148530.2, 23.6, 26.9, 27.0, 0.2, 22672.4, 9, 3, 0],
    ["2026-01", 173599.9, 27.5, 31.4, 31.3, -0.1, 25069.7, 9, 3, 0],
    ["2026-02", 202848.9, 32.2, 36.7, 36.2, -0.4, 29249.0, 8, 4, 0],
    ["2026-03", 233981.1, 37.1, 42.4, 41.6, -0.8, 31132.2, 8, 3, 1],
    ["2026-04", 266640.0, 42.3, 48.6, 47.1, -1.5, 32658.9, 8, 2, 2],
    ["2026-05", 300878.0, 47.7, 54.8, 52.9, -1.9, 34238.0, 8, 1, 3],
    ["2026-06", 335344.9, 53.2, 60.7, 58.3, -2.4, 34466.9, 7, 2, 3],
    ["2026-07", 364718.5, 57.8, 65.8, 63.2, -2.6, 29373.6, 6, 2, 4],
    ["2026-08", 395184.7, 62.7, 69.9, 67.6, -2.3, 30466.2, 6, 2, 4],
    ["2026-09", 424063.4, 67.2, 73.2, 71.2, -2.0, 28878.7, 6, 3, 3],
  ];
  for (const [m, earned, rate, plan, act, gap, monthly, ok, warn, bad] of table) {
    it(m, () => {
      const s = sum(F({ month: m }));
      expect(s.contract).toBe(630700);
      expect(num1(s.earned)).toBe(num1(earned));
      expect(pct(s.rate)).toBe(`${num1(rate)}%`);
      expect(pct(s.planned)).toBe(`${num1(plan)}%`);
      expect(pct(s.actual)).toBe(`${num1(act)}%`);
      expect(round1(s.gap!)).toBe(gap);
      expect(monthly === null ? s.monthly : round1(s.monthly!)).toBe(monthly);
      expect(s.counts).toEqual({ 정상: ok, 주의: warn, 점검: bad });
    });
  }
  it("9월 전체 공정차이는 -2.0pp", () => {
    expect(pp(sum(F()).gap)).toBe("-2.0pp");
  });
});

describe("검산표 — 9월 현장별", () => {
  const s = sum(F());
  const by = Object.fromEntries(s.sites.map((x) => [x.row.siteId, x]));
  it("점검 현장은 D, I, K", () => {
    const ranked = s.sites.filter((x) => x.status === "점검").sort((a, b) => a.gap - b.gap || a.row.siteId.localeCompare(b.row.siteId));
    expect(ranked.map((x) => x.row.siteId)).toEqual(["D", "I", "K"]);
    expect(ranked.map((x) => round1(x.gap))).toEqual([-10.7, -7.6, -5.4]);
  });
  it("D 기성률 69.4%, 당월기성액 3,339.6", () => {
    expect(pct(by.D.rate)).toBe("69.4%");
    expect(num1(by.D.monthly)).toBe("3,339.6");
  });
  it("J 7월 당월기성액은 0.0 (null 아님)", () => {
    const j = summarize(rowsFor(rows, F({ month: "2026-07", siteId: "J" })), rows);
    expect(j.monthly).toBe(0);
    expect(num1(j.monthly)).toBe("0.0");
  });
  it("2025-10은 당월기성액 계산 불가 (누적액으로 대신하지 않음)", () => {
    const first = sum(F({ month: "2025-10" }));
    expect(first.monthly).toBeNull();
    expect(num1(first.monthly)).toBe("계산 불가");
    expect(first.earned).toBeGreaterThan(0);
  });
  it("D 공정차이 8월 -11.2 → 9월 -10.7", () => {
    expect(round1(sum(F({ month: "2026-08", siteId: "D" })).gap!)).toBe(-11.2);
    expect(round1(sum(F({ siteId: "D" })).gap!)).toBe(-10.7);
  });
});

describe("필터", () => {
  it("9월 인천·공동주택은 A·G 2곳", () => {
    const f = F({ region: "인천", projectType: "공동주택" });
    const r = rowsFor(rows, f);
    expect(r.map((x) => x.siteId)).toEqual(["A", "G"]);
    const s = summarize(r, rows);
    expect(s.contract).toBe(185100);
    expect(num1(s.earned)).toBe("113,211.9");
    expect(pct(s.rate)).toBe("61.2%");
  });
  it("지역별 9월 기성률 (검산표)", () => {
    const expected: Record<string, [number, string]> = { 인천: [2, "61.2%"], 경기: [4, "68.5%"], 충남: [2, "73.5%"], 충북: [1, "60.7%"], 세종: [1, "92.7%"], 강원: [1, "60.5%"], 대전: [1, "87.4%"] };
    for (const [region, [n, rate]] of Object.entries(expected)) {
      const s = sum(F({ region }));
      expect(s.siteCount).toBe(n);
      expect(pct(s.rate)).toBe(rate);
    }
  });
  it("지역을 바꿔 선택 현장이 빠지면 현장 선택을 전체로 되돌림", () => {
    const r = normalizeFilter(rows, F({ siteId: "D", region: "인천" }));
    expect(r.siteReset).toBe(true);
    expect(r.filter.siteId).toBe(ALL);
    expect(normalizeFilter(rows, F({ siteId: "A", region: "인천" })).siteReset).toBe(false);
  });
  it("현장 선택 목록은 지역·유형 범위만", () => {
    expect(siteOptions(rows, F({ region: "인천" })).map((s) => s.siteId)).toEqual(["A", "G"]);
  });
  it("범위에 자료가 없으면 0%가 아니라 null", () => {
    const s = sum(F({ region: "인천", projectType: "생산시설" }));
    expect(s.siteCount).toBe(0);
    expect(s.rate).toBeNull();
    expect(pct(s.rate)).toBe("계산 불가");
  });
});

describe("추이", () => {
  const pick = (m: SiteRow[]) => m;
  it("9월 선택 시 12개월, 7월 선택 시 10개월", () => {
    expect(trendUntil(rows, "2026-09", pick)).toHaveLength(12);
    expect(trendUntil(rows, "2026-07", pick)).toHaveLength(10);
    expect(trendUntil(rows, "2025-10", pick)).toHaveLength(1);
  });
  it("첫 달 당월기성액 null, 둘째 달부터 값", () => {
    const t = trendUntil(rows, "2026-09", pick);
    expect(t[0].summary.monthly).toBeNull();
    expect(t[1].summary.monthly).not.toBeNull();
  });
  it("전월 계산", () => {
    expect(prevMonth("2026-01")).toBe("2025-12");
    expect(prevMonth("2026-09")).toBe("2026-08");
  });
});
