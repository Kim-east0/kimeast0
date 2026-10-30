import { FIELDS, type Filter, type SiteRow } from "../types";

const BOM = "﻿";

function cell(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// 원본과 같은 15개 열만 내보낸다(계산 열은 추가하지 않음). 엑셀에서 한글이 깨지지 않게 UTF-8 BOM을 붙인다.
export function toCsv(rows: SiteRow[]): string {
  const lines = [FIELDS.join(","), ...rows.map((r) => FIELDS.map((f) => cell(r[f])).join(","))];
  return BOM + lines.join("\r\n") + "\r\n";
}

export function csvFileName(f: Filter): string {
  const parts = ["현장공정기성", f.month, f.region, f.projectType, f.siteId === "전체" ? "전체현장" : `현장${f.siteId}`];
  return parts.join("_") + ".csv";
}
