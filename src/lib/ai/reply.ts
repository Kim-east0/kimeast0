import type { AiScope } from "./payload";

export interface BasisItem {
  month: string;
  siteId: string;
  field: string;
  value: string;
}

export interface AiReply {
  answer: string;
  basis: BasisItem[];
}

export class ReplyFormatError extends Error {}

// 모델 답변을 검사한다. 전달하지 않은 월·현장을 근거로 단 항목은 버린다(범위 밖 근거를 화면에 올리지 않기 위해).
export function parseModelReply(text: string, scope: AiScope): AiReply {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ReplyFormatError("답변 형식을 읽지 못했습니다");
  }
  const obj = data as { answer?: unknown; basis?: unknown };
  if (typeof obj?.answer !== "string" || obj.answer.trim() === "") throw new ReplyFormatError("답변이 비어 있습니다");
  const list = Array.isArray(obj.basis) ? obj.basis : [];
  const basis: BasisItem[] = [];
  for (const b of list) {
    const it = b as Partial<BasisItem>;
    if (![it?.month, it?.siteId, it?.field, it?.value].every((v) => typeof v === "string")) continue;
    const monthOk = it.month! >= scope.monthRange[0] && it.month! <= scope.monthRange[1];
    const siteOk = it.siteId === "전체" || scope.siteIds.includes(it.siteId!);
    if (monthOk && siteOk) basis.push({ month: it.month!, siteId: it.siteId!, field: it.field!, value: it.value! });
  }
  return { answer: obj.answer.trim(), basis };
}
