"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { allMonths } from "@/lib/calc";
import { intComma, num1, pct } from "@/lib/format";
import { ParseError, parseFileText } from "@/lib/parse";
import { validateParsed, type ValidationResult } from "@/lib/validate";
import { FIELDS } from "@/lib/types";
import { useDashboard } from "@/state/dashboard";

interface Pending {
  fileName: string;
  size: number;
  result: ValidationResult | null; // null이면 파일 자체를 읽지 못한 경우
  readError?: string;
}

type Step = 1 | 2 | 3;

export default function ImportPage() {
  const { rows, sourceName, replaceData } = useDashboard();
  const [pending, setPending] = useState<Pending | null>(null);
  const [applied, setApplied] = useState<{ name: string; count: number } | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setApplied(null);
    try {
      const text = await file.text();
      const parsed = parseFileText(file.name, text);
      setPending({ fileName: file.name, size: file.size, result: validateParsed(parsed) });
    } catch (e) {
      const msg = e instanceof ParseError ? e.message : "파일을 읽지 못했습니다. 다른 파일로 다시 시도하세요";
      setPending({ fileName: file.name, size: file.size, result: null, readError: msg });
    }
    if (input.current) input.current.value = "";
  }

  const result = pending?.result ?? null;
  const failed = !!pending && (pending.result === null || pending.result.errors.length > 0);
  const ok = !!result && !failed;
  const step: Step = applied ? 3 : pending ? 2 : 1;

  function apply() {
    if (!pending || !result || !ok) return;
    replaceData(result.rows, pending.fileName);
    setApplied({ name: pending.fileName, count: result.rows.length });
    setPending(null);
  }

  function cancel() {
    setPending(null);
  }

  const months = result ? allMonths(result.rows) : [];

  return (
    <>
      <div className="page-title">
        <h1>자료 가져오기</h1>
        <span className="sub">CSV 또는 JSON 한 가지만 가져옵니다. 검사와 미리보기 후 전체를 바꿉니다.</span>
      </div>
      <div className="steps" aria-label="진행 단계">
        <span className={step === 1 ? "on" : "done"}>① 파일 고르기</span>
        <span className={step === 2 ? "on" : step === 3 ? "done" : ""}>② 검사·미리보기</span>
        <span className={step === 3 ? "on" : ""}>③ 완료</span>
      </div>

      <div className="import-grid">
        <section className="card">
          <h2>파일 고르기</h2>
          <div
            className={`drop${over ? " over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
          >
            <strong>CSV 또는 JSON 파일을 끌어다 놓으세요</strong>
            <p className="caption" style={{ margin: "0 0 12px" }}>파일은 서버로 보내지 않고 이 브라우저에서만 읽습니다.</p>
            <button className="btn primary" onClick={() => input.current?.click()}>파일 찾기</button>
            <input
              ref={input}
              type="file"
              accept=".csv,.json"
              hidden
              aria-label="파일 찾기"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </div>
          {pending && (
            <div className="file-info">
              <strong>{pending.fileName}</strong>
              <div className="caption">{(pending.size / 1024).toFixed(1)} KB</div>
            </div>
          )}
          <div className="keep">
            지금 자료: {rows ? `${sourceName} (${rows.length}행)` : "없음"}
          </div>
        </section>

        <section className="card" aria-live="polite">
          <h2>검사 결과와 미리보기</h2>
          {!pending && !applied && <p className="caption">파일을 고르면 검사 결과가 여기에 나옵니다.</p>}

          {applied && (
            <div className="done-box" role="status">
              <h3>③ 가져오기 완료</h3>
              <p style={{ margin: "0 0 12px" }}>
                {applied.name}의 {applied.count}행으로 전체를 바꿨습니다. 이전 자료에 이어 붙이지 않았습니다.
              </p>
              <Link href="/" className="link-btn">현황 요약 보기</Link>
            </div>
          )}

          {pending && (
            <>
              {pending.readError && (
                <div className="errors" role="alert">
                  <h3>가져올 수 없습니다</h3>
                  <ul><li>{pending.readError}</li></ul>
                  <div className="keep">지금 자료는 그대로 유지됩니다.</div>
                </div>
              )}

              {result && (
                <>
                  <div className="check-cards">
                    <div className={`check ${FIELDS.length === 15 && !result.errors.some((e) => e.message.includes("필수 열")) ? "ok" : "ng"}`}>
                      <div className="t">필수 15개 열</div>
                      <div className="v">{result.errors.some((e) => e.message.includes("필수 열")) ? "누락 있음" : "확인됨"}</div>
                    </div>
                    <div className={`check ${failed ? "ng" : "ok"}`}>
                      <div className="t">행 수·기간</div>
                      <div className="v num">{ok ? `${result.rows.length}행 · ${months[0]} ~ ${months[months.length - 1]}` : "확인 불가"}</div>
                    </div>
                    <div className={`check ${failed ? "ng" : "ok"}`}>
                      <div className="t">숫자·중복·일관성 검사</div>
                      <div className="v">{failed ? `오류 ${result.errors.length}건` : "오류 0건"}</div>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="errors" role="alert">
                      <h3>가져올 수 없습니다 — 어느 행의 무엇이 문제인지</h3>
                      <ul>{result.errors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
                      <div className="keep">지금 자료는 그대로 유지됩니다. 반영하지 않았습니다.</div>
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="warns">
                      <ul>{result.warnings.map((w, i) => <li key={i}>{w.message}</li>)}</ul>
                    </div>
                  )}
                  {result.notes.length > 0 && (
                    <div className="notes"><ul>{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
                  )}

                  {ok && (
                    <>
                      <h3 style={{ fontSize: 14, margin: "12px 0 6px" }}>미리보기 (앞 5행 / 총 {intComma(result.rows.length)}행)</h3>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>월</th><th>현장</th><th>현장명</th><th>지역</th><th>유형</th>
                              <th className="r">계약금액(백만원)</th><th className="r">계획(%)</th><th className="r">실제(%)</th><th className="r">누적기성액(백만원)</th><th className="r">기성률</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.rows.slice(0, 5).map((r) => (
                              <tr key={`${r.month}${r.siteId}`}>
                                <td className="num">{r.month}</td><td className="num">{r.siteId}</td><td>{r.siteName}</td><td>{r.region}</td><td>{r.projectType}</td>
                                <td className="r num">{intComma(r.contractAmount)}</td>
                                <td className="r num">{num1(r.plannedProgress)}</td>
                                <td className="r num">{num1(r.actualProgress)}</td>
                                <td className="r num">{num1(r.cumulativeEarned)}</td>
                                <td className="r num">{pct((r.cumulativeEarned / r.contractAmount) * 100)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="actions">
                <span className="hint">
                  {ok ? "적용하면 지금 자료를 모두 지우고 이 자료로 바꿉니다(이어 붙이지 않음)." : "오류가 있으면 적용할 수 없습니다."}
                </span>
                <button className="btn" onClick={cancel}>취소 (현재 자료 유지)</button>
                <button className="btn primary" disabled={!ok} onClick={apply}>전체 데이터 교체 적용</button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
