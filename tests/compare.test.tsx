import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseFileText } from "@/lib/parse";
import { validateParsed } from "@/lib/validate";
import { ALL, Filter, SiteRow } from "@/lib/types";
import { RecordDetail } from "@/components/RecordDetail";

const rows: SiteRow[] = validateParsed(
  parseFileText("a.csv", readFileSync(path.resolve(__dirname, "../data/현장공정기성.csv"), "utf-8")),
).rows;
const filter: Filter = { month: "2026-09", region: ALL, projectType: ALL, siteId: ALL };

vi.mock("@/state/dashboard", () => ({
  useDashboard: () => ({ rows, filter, focusSiteId: null, setFocus: () => {} }),
}));

describe("현장별 비교표 화면", () => {
  it("9월 전체: 12개 현장 줄과 합계 줄", async () => {
    const { default: ComparePage } = await import("@/app/compare/page");
    const html = renderToStaticMarkup(<ComparePage />);
    expect((html.match(/class="data-row/g) ?? []).length).toBe(12);
    for (const t of ["630,700", "424,063.4", "67.2%", "73.2%", "71.2%", "-2.0pp", "합계·가중평균 (12개 현장)", "당월 주요 공종", "지역", "공사 유형"]) {
      expect(html, t).toContain(t);
    }
    expect(html).toContain("점검 (-10.7pp)");
    expect(html).not.toContain("detail-row"); // 처음에는 모두 접힌 상태
  });
});

describe("기록 펼침", () => {
  it("D 9월: 공사기간·기록된 상황·계획된 대응", () => {
    const d = rows.find((r) => r.month === "2026-09" && r.siteId === "D")!;
    const html = renderToStaticMarkup(<RecordDetail r={d} />);
    expect(html).toContain("2024-09-02 ~ 2027-02-28");
    expect(html).toContain("골조 자재 공급 정상화 후 작업면 추가 운영 중");
    expect(html).toContain("층별 작업 순서와 투입 인원을 주간 단위로 확인");
    expect(html).toContain("실제 완료일·예측일이 아닙니다");
    expect(html).toContain("완료·효과를 뜻하지 않습니다");
  });
});
