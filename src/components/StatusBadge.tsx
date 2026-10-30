import type { Status } from "@/lib/types";
import { pp } from "@/lib/format";

// 색만으로 구분하지 않도록 글자(정상·주의·점검)와 공정차이를 함께 보여 준다
export function StatusBadge({ status, gap }: { status: Status; gap: number }) {
  return <span className={`badge st-${status}`}>{status} ({pp(gap)})</span>;
}

export function gapClass(status: Status): string {
  return status === "점검" ? "gap-neg" : status === "주의" ? "gap-mid" : "gap-pos";
}
