"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildPayload, MAX_QUESTION, scopeKey, type AiPayload } from "@/lib/ai/payload";
import type { BasisItem } from "@/lib/ai/reply";
import { monthLabel, num1, pp } from "@/lib/format";
import { ALL } from "@/lib/types";
import { useDashboard } from "@/state/dashboard";
import { EmptyData } from "@/components/EmptyData";

const EXAMPLES = ["D가 늦어진 원인과 대응은?", "I는 왜 점검 상태인가요?", "K의 기록된 대응 계획은?"];
const CLIENT_TIMEOUT_MS = 30_000;

type View =
  | { kind: "idle" }
  | { kind: "loading"; question: string }
  | { kind: "done"; question: string; answer: string; basis: BasisItem[]; mock: boolean; payload: AiPayload }
  | { kind: "error"; question: string; message: string };

const cellNum = (v: number | string | undefined, fmt: (n: number) => string) => (typeof v === "number" ? fmt(v) : (v ?? "-"));

export default function AskPage() {
  const { rows, filter } = useDashboard();
  const [question, setQuestion] = useState("");
  const [view, setView] = useState<View>({ kind: "idle" });
  const controller = useRef<AbortController | null>(null);
  const currentKey = useRef("");

  const key = scopeKey(filter);
  currentKey.current = key;

  // 월·지역·유형·현장이 바뀌거나 자료가 바뀌면 이전 답변을 지우고, 진행 중인 요청의 늦은 응답도 버린다
  useEffect(() => {
    controller.current?.abort();
    controller.current = null;
    setView({ kind: "idle" });
  }, [key, rows]);

  const scope = useMemo(() => (rows ? buildPayload(rows, filter).scope : null), [rows, filter]);

  const ask = useCallback(
    async (q: string) => {
      if (!rows) return;
      const text = q.trim();
      if (!text || text.length > MAX_QUESTION) return;
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      const askedKey = key;
      const payload = buildPayload(rows, filter);
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, CLIENT_TIMEOUT_MS);
      setView({ kind: "loading", question: text });
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, payload }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        // 요청하는 동안 범위가 바뀌었다면 이전 범위의 답변은 화면에 올리지 않는다
        if (currentKey.current !== askedKey) return;
        if (data.ok) {
          setView({ kind: "done", question: text, answer: data.answer, basis: data.basis ?? [], mock: !!data.mock, payload });
        } else {
          setView({ kind: "error", question: text, message: data.message ?? "AI 연결에 실패했습니다." });
        }
      } catch {
        if (currentKey.current !== askedKey) return;
        if (!timedOut && ctrl.signal.aborted) return;
        setView({
          kind: "error",
          question: text,
          message: timedOut ? "AI 응답 시간이 초과되었습니다. 다시 시도하세요." : "AI 서비스에 연결하지 못했습니다. 잠시 뒤 다시 시도하세요.",
        });
      } finally {
        clearTimeout(timer);
      }
    },
    [rows, filter, key],
  );

  if (!rows || !scope) {
    return (
      <>
        <div className="page-title"><h1>AI에게 묻기</h1></div>
        <EmptyData what="자료가 없어 질문할 수 없습니다." />
      </>
    );
  }

  const loading = view.kind === "loading";
  const tooLong = question.length > MAX_QUESTION;
  const canAsk = question.trim().length > 0 && !tooLong && !loading;

  return (
    <>
      <div className="page-title">
        <h1>AI에게 묻기</h1>
        <span className="sub">계산은 프로그램이 하고, AI는 그 숫자와 기록된 내용을 근거로 설명합니다</span>
      </div>

      <section className="card" aria-label="지금 범위">
        <h2>지금 범위</h2>
        <p className="scope-line">
          <strong>{monthLabel(scope.month)}</strong> · {filter.region === ALL ? "전체 지역" : filter.region} ·{" "}
          {filter.projectType === ALL ? "전체 유형" : filter.projectType} ·{" "}
          {filter.siteId === ALL ? "전체 현장" : `현장 ${filter.siteId}`} ({scope.siteCount}곳)
        </p>
        <div className="caption">
          AI에게는 이 범위의 {monthLabel(scope.month)} 기록과 계산된 지표, {scope.monthRange[0]} ~ {scope.monthRange[1]} 월별 요약만 전달됩니다.
          {filter.siteId !== ALL && " 현장 한 곳을 골라서 그 현장의 월별 기록도 함께 전달됩니다."} 위쪽 필터를 바꾸면 이전 답변은 지워집니다.
        </div>
      </section>

      <section className="card" aria-label="질문">
        <h2>질문</h2>
        <div className="examples" role="group" aria-label="예시 질문">
          {EXAMPLES.map((e) => (
            <button key={e} className="btn" onClick={() => setQuestion(e)}>{e}</button>
          ))}
        </div>
        <textarea
          className="ask-input"
          value={question}
          rows={3}
          placeholder="예: D가 늦어진 원인과 대응은?"
          aria-label="질문 입력"
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canAsk) void ask(question);
          }}
        />
        <div className="ask-actions">
          <span className={`caption num${tooLong ? " over-limit" : ""}`}>{question.length} / {MAX_QUESTION}자{tooLong ? " — 500자를 넘었습니다" : ""}</span>
          <button className="btn primary" disabled={!canAsk} onClick={() => void ask(question)}>질문하기</button>
        </div>
      </section>

      {view.kind === "loading" && (
        <section className="card ask-wait" role="status" aria-live="polite">
          <strong>답변을 기다리는 중…</strong>
          <span className="caption">“{view.question}” · 최대 30초까지 기다립니다.</span>
        </section>
      )}

      {view.kind === "error" && (
        <section className="card ask-error" role="alert">
          <h2>AI 연결 실패</h2>
          <p>{view.message}</p>
          <p className="keep">대시보드와 CSV 내보내기는 계속 쓸 수 있습니다.</p>
          <button className="btn" onClick={() => void ask(view.question)}>다시 시도</button>
        </section>
      )}

      {view.kind === "done" && (
        <section className="card" aria-label="답변" aria-live="polite">
          <div className="answer-head">
            <h2>답변</h2>
            {view.mock && <span className="badge st-주의">모의 응답</span>}
          </div>
          <div className="caption">질문: {view.question}</div>
          <p className="answer">{view.answer}</p>

          <div className="basis">
            <h3>근거</h3>
            <div className="caption" style={{ marginBottom: 6 }}>
              기준 월 {monthLabel(view.payload.scope.month)} · 현장 {view.payload.scope.siteCount === 0 ? "없음" : view.payload.scope.siteIds.join(", ")}
            </div>
            {view.basis.length === 0 ? (
              <p className="caption">답변에 붙은 근거 항목이 없습니다. 자료에 없는 내용이면 “알 수 없음”으로 안내됩니다.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>기준 월</th><th>현장</th><th>참고한 항목</th><th>값</th></tr></thead>
                  <tbody>
                    {view.basis.map((b, i) => (
                      <tr key={i}>
                        <td className="num">{b.month}</td><td className="num">{b.siteId}</td><td>{b.field}</td><td style={{ whiteSpace: "normal" }}>{b.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="basis">
            <h3>프로그램이 계산한 숫자 <span className="caption">(AI가 계산한 값이 아닙니다)</span></h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>현장</th><th className="r">공정차이</th><th>상태</th><th className="r">기성률(%)</th><th className="r">당월기성액(백만원)</th></tr></thead>
                <tbody>
                  {view.payload.computed.sites.map((s) => (
                    <tr key={String(s.siteId)}>
                      <td className="num">{s.siteId}</td>
                      <td className="r num">{cellNum(s["공정차이_pp"], (n) => pp(n))}</td>
                      <td>{s["상태"]}</td>
                      <td className="r num">{cellNum(s["기성률_퍼센트"], (n) => num1(n))}</td>
                      <td className="r num">{cellNum(s["당월기성액_백만원"], (n) => num1(n))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
