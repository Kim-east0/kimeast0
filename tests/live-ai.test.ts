// 실제 Gemini를 호출하는 확인용 검사. 기본 실행에서는 건너뛰고 LIVE_AI=1 일 때만 개발 서버(3000)로 호출한다.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseFileText } from "@/lib/parse";
import { validateParsed } from "@/lib/validate";
import { buildPayload } from "@/lib/ai/payload";
import { ALL, Filter, SiteRow } from "@/lib/types";

const live = process.env.LIVE_AI === "1";
const rows: SiteRow[] = validateParsed(
  parseFileText("a.csv", readFileSync(path.resolve(__dirname, "../data/현장공정기성.csv"), "utf-8")),
).rows;
const F = (o: Partial<Filter> = {}): Filter => ({ month: "2026-09", region: ALL, projectType: ALL, siteId: ALL, ...o });

async function ask(question: string, filter: Filter) {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, payload: buildPayload(rows, filter) }),
  });
  return (await res.json()) as { ok: boolean; mock?: boolean; code?: string; message?: string; answer?: string; basis?: { month: string; siteId: string; field: string; value: string }[] };
}

const cases: [string, string, Filter][] = [
  ["D 원인·대응", "D가 늦어진 원인과 대응은?", F({ siteId: "D" })],
  ["D 회복", "D는 회복 중인가요?", F({ siteId: "D" })],
  ["J 7월", "J의 7월 기성이 왜 늘지 않았나요?", F({ month: "2026-07", siteId: "J" })],
  ["준공일·미수금", "실제 준공일과 미수금은 얼마인가요?", F({ siteId: "D" })],
  ["점검 현장", "점검이 필요한 현장은 어디인가요?", F()],
  ["범위 밖", "2026년 12월의 D 공정차이는?", F({ siteId: "D" })],
];

describe.skipIf(!live)("실제 AI 호출", () => {
  for (const [name, q, f] of cases) {
    it(name, async () => {
      const r = await ask(q, f);
      console.log(`\n■ ${name} — ${q}\n  ok=${r.ok} mock=${r.mock ?? "-"} code=${r.code ?? "-"}\n  답변: ${r.answer ?? r.message}\n  근거: ${JSON.stringify(r.basis ?? [])}`);
      expect(r.ok).toBe(true);
      expect(r.mock).toBe(false);
    }, 60_000);
  }
});
