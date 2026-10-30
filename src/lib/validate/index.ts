import { FIELDS, FIRST_MONTH, ImportIssue, LAST_MONTH, PROJECT_TYPES, REGIONS, SiteRow } from "../types";
import type { ParsedFile, RawRecord } from "../parse";

export interface ValidationResult {
  rows: SiteRow[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  notes: string[];
}

const NUMBER_RE = /^-?\d+(\.\d+)?$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ERRORS = 30;

function validDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
}

export function validateParsed(parsed: ParsedFile): ValidationResult {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const notes: string[] = [];
  const err = (message: string) => errors.push({ level: "error", message });

  if (parsed.kind === "csv") {
    notes.push("CSV에는 메타데이터가 없어서 데이터 설명서의 단위(금액 백만원, 비율 %)와 열 기준을 적용했습니다.");
    const missing = FIELDS.filter((f) => !parsed.header!.includes(f));
    if (missing.length > 0) err(`필수 열이 없습니다: ${missing.join(", ")}`);
  } else if (parsed.metadata) {
    const m = parsed.metadata;
    if (m.schemaVersion !== "2.0") err(`metadata의 schemaVersion이 2.0이 아닙니다 (${String(m.schemaVersion)})`);
    if (m.moneyUnit !== "백만원") err(`metadata의 moneyUnit이 백만원이 아닙니다 (${String(m.moneyUnit)})`);
    if (m.progressUnit !== "percent_0_100") err(`metadata의 progressUnit이 percent_0_100이 아닙니다 (${String(m.progressUnit)})`);
    const req = m.requiredFields;
    if (!Array.isArray(req) || FIELDS.some((f) => !req.includes(f))) {
      err("metadata의 requiredFields가 15개 필수 열과 맞지 않습니다");
    }
  } else {
    warnings.push({ level: "warning", message: "JSON에 metadata가 없어서 데이터 설명서의 단위 기준을 적용했습니다." });
  }

  if (parsed.records.length === 0) err("데이터 행이 없습니다");

  const rows: SiteRow[] = [];
  const where = new Map<SiteRow, RawRecord>();
  const seen = new Map<string, string>();

  for (const rec of parsed.records) {
    if (errors.length >= MAX_ERRORS) break;
    const v = rec.values;
    const label = `${String(v.month ?? "?")} / ${String(v.siteId ?? "?")}`;
    let bad = false;
    const fail = (msg: string) => {
      err(`${rec.where}: ${label}의 ${msg}`);
      bad = true;
    };

    for (const f of FIELDS) {
      if (isEmpty(v[f])) fail(`${f}가 비어 있습니다. 0으로 바꾸지 않았습니다`);
    }
    if (bad) continue;

    const num = (f: string): number | null => {
      const raw = v[f];
      const n = typeof raw === "number" ? raw : NUMBER_RE.test(String(raw).trim()) ? Number(String(raw).trim()) : NaN;
      if (!Number.isFinite(n)) {
        fail(`${f} "${String(raw)}"는 숫자가 아닙니다`);
        return null;
      }
      return n;
    };

    const contractAmount = num("contractAmount");
    const plannedProgress = num("plannedProgress");
    const actualProgress = num("actualProgress");
    const cumulativeEarned = num("cumulativeEarned");
    if (bad) continue;

    const month = String(v.month).trim();
    const siteId = String(v.siteId).trim();
    if (!MONTH_RE.test(month)) fail(`month "${month}"는 YYYY-MM 형식이 아닙니다`);
    else if (month < FIRST_MONTH || month > LAST_MONTH) fail(`month가 ${FIRST_MONTH}~${LAST_MONTH} 범위를 벗어났습니다`);
    if (!/^[A-L]$/.test(siteId)) fail(`siteId "${siteId}"는 A~L이 아닙니다`);
    if (contractAmount! <= 0) fail(`contractAmount ${contractAmount}는 0보다 커야 합니다`);
    for (const [f, n] of [
      ["plannedProgress", plannedProgress],
      ["actualProgress", actualProgress],
    ] as const) {
      if (n! < 0 || n! > 100) fail(`${f} ${n}는 0~100 범위를 벗어났습니다`);
    }
    if (cumulativeEarned! < 0 || cumulativeEarned! > contractAmount!) {
      fail(`cumulativeEarned ${cumulativeEarned}는 0 이상, 계약금액(${contractAmount}) 이하여야 합니다`);
    }
    const region = String(v.region).trim();
    const projectType = String(v.projectType).trim();
    if (!(REGIONS as readonly string[]).includes(region)) fail(`region "${region}"는 정해진 지역이 아닙니다`);
    if (!(PROJECT_TYPES as readonly string[]).includes(projectType)) fail(`projectType "${projectType}"는 정해진 공사 유형이 아닙니다`);
    const startDate = String(v.startDate).trim();
    const contractEndDate = String(v.contractEndDate).trim();
    if (!validDate(startDate)) fail(`startDate "${startDate}"는 YYYY-MM-DD 날짜가 아닙니다`);
    if (!validDate(contractEndDate)) fail(`contractEndDate "${contractEndDate}"는 YYYY-MM-DD 날짜가 아닙니다`);
    if (!bad) {
      if (startDate >= contractEndDate) fail("착공일이 계약상 준공일보다 늦거나 같습니다");
      else if (month < startDate.slice(0, 7)) fail("월말 기준일이 착공 전입니다");
    }
    const siteName = String(v.siteName).trim();
    if (!siteName.includes("[가상]")) fail("siteName에 [가상] 표시가 없습니다");
    if (bad) continue;

    const key = `${month}|${siteId}`;
    if (seen.has(key)) {
      err(`${rec.where}: ${label}가 중복되었습니다 (${seen.get(key)}과 같은 월·현장)`);
      continue;
    }
    seen.set(key, rec.where);

    const row: SiteRow = {
      month,
      siteId,
      siteName,
      contractAmount: contractAmount!,
      plannedProgress: plannedProgress!,
      actualProgress: actualProgress!,
      cumulativeEarned: cumulativeEarned!,
      region,
      projectType,
      startDate,
      contractEndDate,
      currentWork: String(v.currentWork).trim(),
      issueCategory: String(v.issueCategory).trim(),
      issueSummary: String(v.issueSummary).trim(),
      actionPlan: String(v.actionPlan).trim(),
    };
    rows.push(row);
    where.set(row, rec);
  }

  if (errors.length === 0) {
    // 같은 현장의 고정 정보 일치, 누적값 감소 검사
    const bySite = new Map<string, SiteRow[]>();
    for (const r of rows) bySite.set(r.siteId, [...(bySite.get(r.siteId) ?? []), r]);
    for (const [id, list] of bySite) {
      list.sort((a, b) => a.month.localeCompare(b.month));
      const first = list[0];
      for (const r of list) {
        for (const f of ["siteName", "region", "projectType", "contractAmount", "startDate", "contractEndDate"] as const) {
          if (r[f] !== first[f]) {
            err(`${where.get(r)!.where}: ${r.month} / ${id}의 ${f}(${r[f]})가 같은 현장의 다른 행(${first[f]})과 다릅니다`);
          }
        }
      }
      for (let i = 1; i < list.length; i++) {
        const prev = list[i - 1];
        const cur = list[i];
        for (const f of ["plannedProgress", "actualProgress", "cumulativeEarned"] as const) {
          if (cur[f] < prev[f]) {
            err(`${where.get(cur)!.where}: ${cur.month} / ${id}의 ${f}(${cur[f]})가 전월(${prev[f]})보다 줄었습니다`);
          }
        }
      }
    }
    // 같은 siteId에 다른 siteName이 섞인 경우는 위에서 잡힘. 월 누락은 경고만
    if (errors.length === 0 && rows.length > 0) {
      const months = [...new Set(rows.map((r) => r.month))].sort();
      const expected: string[] = [];
      for (let m = months[0]; m <= months[months.length - 1]; m = nextMonth(m)) expected.push(m);
      let missing = 0;
      for (const [, list] of bySite) {
        const have = new Set(list.map((r) => r.month));
        missing += expected.filter((m) => !have.has(m)).length;
      }
      if (missing > 0) {
        warnings.push({
          level: "warning",
          message: `일부 월 자료가 없습니다(${missing}건). 확인되는 행만 집계했고, 전월이 없는 달의 당월기성액은 계산 불가입니다.`,
        });
      }
    }
  }

  if (errors.length >= MAX_ERRORS) {
    errors.push({ level: "error", message: `오류가 많아 처음 ${MAX_ERRORS}개만 보여 드립니다.` });
  }

  return { rows: errors.length === 0 ? rows : [], errors, warnings, notes };
}
