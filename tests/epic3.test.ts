import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseFileText } from "@/lib/parse";
import { validateParsed } from "@/lib/validate";
import { buildPayload, MAX_QUESTION } from "@/lib/ai/payload";
import { buildUserText, SYSTEM_INSTRUCTION } from "@/lib/ai/prompt";
import { parseModelReply, ReplyFormatError } from "@/lib/ai/reply";
import { ALL, Filter, SiteRow } from "@/lib/types";

const rows: SiteRow[] = validateParsed(
  parseFileText("a.csv", readFileSync(path.resolve(__dirname, "../data/현장공정기성.csv"), "utf-8")),
).rows;
const F = (o: Partial<Filter> = {}): Filter => ({ month: "2026-09", region: ALL, projectType: ALL, siteId: ALL, ...o });

describe("AI에 보내는 자료", () => {
  it("9월 전체: 원문 12행, 계산 지표, 12개월 요약, 현장별 기록은 없음", () => {
    const p = buildPayload(rows, F());
    expect(p.scope.siteCount).toBe(12);
    expect(p.records).toHaveLength(12);
    expect(p.records.every((r) => r.month === "2026-09")).toBe(true);
    expect(p.computed.summary["기성률_퍼센트"]).toBe(67.2);
    expect(p.computed.summary["공정차이_pp"]).toBe(-2);
    expect(p.computed.summary["당월기성액_백만원"]).toBe(28878.7);
    expect(p.trend).toHaveLength(12);
    expect(p.siteHistory).toBeNull();
  });
  it("원문 기록과 계산 지표가 서로 다른 항목으로 나뉨", () => {
    const p = buildPayload(rows, F({ siteId: "D" }));
    const text = buildUserText("D가 늦어진 원인과 대응은?", p);
    expect(text).toContain("[현장이 기록한 원문");
    expect(text).toContain("[프로그램이 계산한 지표");
    expect(text).toContain("골조 자재 공급 정상화 후 작업면 추가 운영 중");
    expect(p.records[0]).toHaveProperty("issueSummary");
    expect(p.computed.sites[0]).not.toHaveProperty("issueSummary");
  });
  it("D: 8월 -11.2 → 9월 -10.7 요약이 들어감, 선택 월 이후는 없음", () => {
    const p = buildPayload(rows, F({ siteId: "D" }));
    const aug = p.trend.find((t) => t.month === "2026-08")!;
    const sep = p.trend.find((t) => t.month === "2026-09")!;
    expect(aug["공정차이_pp"]).toBe(-11.2);
    expect(sep["공정차이_pp"]).toBe(-10.7);
    expect(p.trend.some((t) => String(t.month) > "2026-09")).toBe(false);
    expect(p.siteHistory).toHaveLength(12);
  });
  it("현재 월이 7월이면 8·9월 자료는 보내지 않음", () => {
    const p = buildPayload(rows, F({ month: "2026-07", siteId: "D" }));
    expect(p.trend).toHaveLength(10);
    expect(p.siteHistory!.every((h) => h.month <= "2026-07")).toBe(true);
    expect(JSON.stringify(p)).not.toContain("2026-08");
  });
  it("J 7월: 기성 확인 서류 보완 기록과 당월기성액 0이 함께 전달됨", () => {
    const p = buildPayload(rows, F({ month: "2026-07", siteId: "J" }));
    expect(p.siteHistory!.find((h) => h.month === "2026-07")!.issueSummary).toContain("서류 보완");
    expect(p.trend.find((t) => t.month === "2026-07")!["당월기성액_백만원"]).toBe(0);
  });
  it("2025-10 당월기성액은 '계산 불가'", () => {
    const p = buildPayload(rows, F({ month: "2025-10" }));
    expect(p.computed.summary["당월기성액_백만원"]).toBe("계산 불가");
  });
  it("지역·유형 필터가 그대로 적용됨 (인천·공동주택 → A, G)", () => {
    const p = buildPayload(rows, F({ region: "인천", projectType: "공동주택" }));
    expect(p.scope.siteIds).toEqual(["A", "G"]);
    expect(p.records.map((r) => r.siteId)).toEqual(["A", "G"]);
    expect(JSON.stringify(p)).not.toContain("김포");
  });
  it("시스템 지시문에 핵심 규칙이 있음", () => {
    for (const t of ["기록된 상황", "계획된 대응", "실제 준공일", "미수금", "계산 불가", "원인을 확정하거나"]) {
      expect(SYSTEM_INSTRUCTION, t).toContain(t);
    }
  });
});

describe("모델 답변 검사", () => {
  const scope = buildPayload(rows, F({ siteId: "D" })).scope;
  it("정상 답변은 통과", () => {
    const r = parseModelReply(JSON.stringify({ answer: "답", basis: [{ month: "2026-09", siteId: "D", field: "issueSummary", value: "x" }] }), scope);
    expect(r.basis).toHaveLength(1);
  });
  it("전달하지 않은 월·현장을 근거로 단 항목은 버림", () => {
    const r = parseModelReply(
      JSON.stringify({
        answer: "답",
        basis: [
          { month: "2026-09", siteId: "D", field: "a", value: "1" },
          { month: "2026-10", siteId: "D", field: "b", value: "2" },
          { month: "2026-09", siteId: "K", field: "c", value: "3" },
          { month: "2026-09", siteId: "전체", field: "d", value: "4" },
        ],
      }),
      scope,
    );
    expect(r.basis.map((b) => b.field)).toEqual(["a", "d"]);
  });
  it("JSON이 아니거나 답이 비면 형식 오류", () => {
    expect(() => parseModelReply("그냥 글자", scope)).toThrow(ReplyFormatError);
    expect(() => parseModelReply(JSON.stringify({ answer: "", basis: [] }), scope)).toThrow(ReplyFormatError);
  });
  it("근거가 빈 목록이어도 답변은 통과 (자료 없음 답변)", () => {
    expect(parseModelReply(JSON.stringify({ answer: "자료에 없습니다", basis: [] }), scope).basis).toEqual([]);
  });
});

describe("서버 /api/ask (모의 응답으로 검사, 실제 AI 호출 아님)", () => {
  const SECRET = "TEST-SECRET-KEY-12345";
  const payload = buildPayload(rows, F({ siteId: "D" }));
  const call = async (body: unknown) => {
    const { POST } = await import("@/app/api/ask/route");
    const res = await POST(new Request("http://x/api/ask", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
    return { status: res.status, json: await res.json(), text: "" };
  };
  const gemini = (text: string, status = 200) => vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status }));

  beforeEach(() => {
    vi.resetModules();
    delete process.env.GEMINI_MOCK;
    process.env.GEMINI_API_KEY = SECRET;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MOCK;
  });

  it("정상 호출: 키는 헤더로만 보내고, 본문·주소에 넣지 않음", async () => {
    const f = gemini(JSON.stringify({ answer: "기록대로 설명", basis: [{ month: "2026-09", siteId: "D", field: "issueSummary", value: "공급 정상화" }] }));
    vi.stubGlobal("fetch", f);
    const r = await call({ question: "D가 늦어진 원인과 대응은?", payload });
    expect(r.json.ok).toBe(true);
    expect(r.json.mock).toBe(false);
    expect(r.json.basis).toHaveLength(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("gemini-3.8-flash");
    expect(url).not.toContain(SECRET);
    expect(String(init.body)).not.toContain(SECRET);
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(SECRET);
    expect(String(init.body)).toContain("골조 자재 공급 정상화 후");
  });
  it("키가 없으면 AI 연결 실패(no_key), 외부 호출 안 함", async () => {
    delete process.env.GEMINI_API_KEY;
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = await call({ question: "질문", payload });
    expect(r.json).toMatchObject({ ok: false, code: "no_key" });
    expect(f).not.toHaveBeenCalled();
  });
  it.each([
    [429, "quota"],
    [403, "auth"],
    [404, "model"],
    [500, "upstream"],
  ])("외부 응답 %i → %s, 오류 문구에 키 없음", async (status, code) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`bad ${SECRET}`, { status })));
    const r = await call({ question: "질문", payload });
    expect(r.json).toMatchObject({ ok: false, code });
    expect(JSON.stringify(r.json)).not.toContain(SECRET);
  });
  it("시간 초과 → timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw Object.assign(new Error("x"), { name: "TimeoutError" }); }));
    expect((await call({ question: "질문", payload })).json).toMatchObject({ ok: false, code: "timeout" });
  });
  it("네트워크 오류 → upstream", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect((await call({ question: "질문", payload })).json).toMatchObject({ ok: false, code: "upstream" });
  });
  it("형식이 깨진 답변 → bad_format", async () => {
    vi.stubGlobal("fetch", gemini("JSON 아님"));
    expect((await call({ question: "질문", payload })).json).toMatchObject({ ok: false, code: "bad_format" });
  });
  it("질문이 비었거나 500자를 넘으면 거부", async () => {
    vi.stubGlobal("fetch", gemini(JSON.stringify({ answer: "답", basis: [] })));
    expect((await call({ question: "  ", payload })).json.code).toBe("bad_request");
    expect((await call({ question: "가".repeat(MAX_QUESTION + 1), payload })).json.code).toBe("bad_request");
    expect((await call({ question: "가".repeat(MAX_QUESTION), payload })).json.ok).toBe(true); // 정확히 500자는 허용
    expect((await call("not json")).json.code).toBe("bad_request");
    expect((await call({ question: "질문" })).json.code).toBe("bad_request");
  });
  it("모의 응답 모드는 '모의 응답'으로 표시되고 외부 호출 안 함", async () => {
    process.env.GEMINI_MOCK = "1";
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = await call({ question: "질문", payload });
    expect(r.json).toMatchObject({ ok: true, mock: true });
    expect(f).not.toHaveBeenCalled();
  });
});
