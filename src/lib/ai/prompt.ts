import type { AiPayload } from "./payload";

export const SYSTEM_INSTRUCTION = `당신은 건설 현장 공정·기성 대시보드의 설명 도우미입니다. 모든 자료는 교육용 가상 자료이며 실제 회사의 현장·계약·실적이 아닙니다.

규칙:
1. 아래에 주어진 자료만 근거로 답합니다. 숫자는 "프로그램이 계산한 지표"에 있는 값을 그대로 인용하고, 직접 계산하지 않습니다.
2. issueSummary는 "기록된 상황", actionPlan은 "계획된 대응"으로 설명합니다. 원인을 확정하거나 대응이 완료되었다·효과가 있었다고 단정하지 않습니다.
3. 상태(정상·주의·점검)는 공정차이로만 판단합니다. issueCategory는 현장 기록 분류일 뿐 상태 판정이 아닙니다.
4. 계약상 준공일(contractEndDate)은 예정 일정입니다. 실제 준공일, 준공 예측, 수금·미수금·청구, 기상 실측은 자료에 없으므로 "자료에 없어 알 수 없습니다"라고 답합니다.
5. 전달되지 않은 월·현장·범위는 답하지 않고 전달된 범위를 안내합니다. 숫자나 원인을 만들어 내지 않습니다.
6. 첫 달(전월이 없는 달)의 당월기성액은 "계산 불가"입니다. 누적기성액을 당월 금액으로 바꾸지 않습니다. 0.0은 계산된 정상값입니다.
7. 금액은 백만원, 비율은 %, 공정차이는 pp 단위로 적습니다.
8. 쉬운 말로 짧게 답합니다(5문장 이내). 비유는 쓰지 않습니다.
9. 답변과 함께 근거 목록(basis)을 반드시 채웁니다. 각 항목은 기준 월(month), 현장 ID(siteId, 범위 전체면 "전체"), 참고한 필드나 지표 이름(field), 그 값(value)입니다. 자료에 없어 답할 수 없을 때는 basis를 빈 목록으로 둡니다.`;

export function buildUserText(question: string, p: AiPayload): string {
  return [
    `[질문]\n${question}`,
    `[전달한 범위]\n${JSON.stringify(p.scope)}`,
    `[현장이 기록한 원문 — 선택 월 ${p.scope.month}의 원문 행]\n${JSON.stringify(p.records)}`,
    `[프로그램이 계산한 지표 — 선택 월 ${p.scope.month}]\n${JSON.stringify(p.computed)}`,
    `[월별 요약 — ${p.scope.monthRange[0]} ~ ${p.scope.monthRange[1]}, 같은 지역·유형·현장 범위]\n${JSON.stringify(p.trend)}`,
    p.siteHistory ? `[현장 ${p.scope.siteId}의 월별 기록 — 원문]\n${JSON.stringify(p.siteHistory)}` : "[현장 한 곳을 고르지 않아 월별 기록은 전달하지 않음]",
  ].join("\n\n");
}

export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    basis: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          month: { type: "STRING" },
          siteId: { type: "STRING" },
          field: { type: "STRING" },
          value: { type: "STRING" },
        },
        required: ["month", "siteId", "field", "value"],
      },
    },
  },
  required: ["answer", "basis"],
};
