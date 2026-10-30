import { MAX_QUESTION, type AiPayload } from "@/lib/ai/payload";
import { buildUserText, RESPONSE_SCHEMA, SYSTEM_INSTRUCTION } from "@/lib/ai/prompt";
import { parseModelReply, ReplyFormatError, type AiReply } from "@/lib/ai/reply";

export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const UPSTREAM_TIMEOUT_MS = 25_000;
const MAX_BODY_CHARS = 400_000;

type ErrorCode = "no_key" | "quota" | "auth" | "model" | "timeout" | "bad_format" | "upstream" | "bad_request";

const MESSAGES: Record<ErrorCode, string> = {
  no_key: "AI 키가 설정되지 않았습니다. .env.local의 GEMINI_API_KEY를 확인하세요.",
  quota: "AI 호출 한도를 넘었습니다. 잠시 뒤 다시 시도하세요.",
  auth: "AI 키가 올바르지 않거나 사용 권한이 없습니다. .env.local의 키를 확인하세요.",
  model: `AI 모델(${MODEL})을 찾을 수 없습니다.`,
  timeout: "AI 응답 시간이 초과되었습니다. 다시 시도하세요.",
  bad_format: "AI 답변 형식을 읽지 못했습니다. 다시 시도하세요.",
  upstream: "AI 서비스에 연결하지 못했습니다. 잠시 뒤 다시 시도하세요.",
  bad_request: "질문 형식이 올바르지 않습니다.",
};

function fail(code: ErrorCode, status: number): Response {
  // 오류 문구에는 키·원문 응답을 넣지 않는다
  return Response.json({ ok: false, code, message: MESSAGES[code] }, { status });
}

function isPayload(p: unknown): p is AiPayload {
  const x = p as Partial<AiPayload> | null;
  return (
    !!x &&
    typeof x === "object" &&
    !!x.scope &&
    Array.isArray(x.scope.siteIds) &&
    Array.isArray(x.scope.monthRange) &&
    Array.isArray(x.records) &&
    !!x.computed &&
    Array.isArray(x.trend)
  );
}

function mockReply(p: AiPayload): AiReply {
  const first = p.records[0];
  return {
    answer: "모의 응답입니다. 실제 AI를 호출하지 않았고, 전달된 범위만 확인했습니다.",
    basis: first ? [{ month: first.month, siteId: first.siteId, field: "issueSummary", value: first.issueSummary }] : [],
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: { question?: unknown; payload?: unknown };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) return fail("bad_request", 413);
    body = JSON.parse(text);
  } catch {
    return fail("bad_request", 400);
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > MAX_QUESTION || !isPayload(body.payload)) return fail("bad_request", 400);
  const payload = body.payload;

  if (process.env.GEMINI_MOCK === "1") {
    return Response.json({ ok: true, mock: true, ...mockReply(payload) });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return fail("no_key", 503);

  let upstream: Response;
  try {
    upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: buildUserText(question, payload) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
  } catch (e) {
    const name = (e as { name?: string })?.name;
    return name === "TimeoutError" || name === "AbortError" ? fail("timeout", 504) : fail("upstream", 502);
  }

  if (!upstream.ok) {
    if (upstream.status === 429) return fail("quota", 429);
    if (upstream.status === 401 || upstream.status === 403) return fail("auth", 502);
    if (upstream.status === 404) return fail("model", 502);
    return fail("upstream", 502);
  }

  try {
    const data = (await upstream.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const reply = parseModelReply(text, payload.scope);
    return Response.json({ ok: true, mock: false, ...reply });
  } catch (e) {
    return e instanceof ReplyFormatError ? fail("bad_format", 502) : fail("upstream", 502);
  }
}
