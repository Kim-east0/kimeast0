import { parseCsvText } from "./csv";

export interface RawRecord {
  // 사용자에게 알려 줄 위치. CSV는 파일 줄 번호, JSON은 기록 순번
  where: string;
  values: Record<string, unknown>;
}

export interface ParsedFile {
  kind: "csv" | "json";
  header: string[] | null;
  records: RawRecord[];
  metadata: Record<string, unknown> | null;
}

export class ParseError extends Error {}

export function parseCsv(text: string): ParsedFile {
  const rows = parseCsvText(text);
  if (rows.length === 0) throw new ParseError("파일이 비어 있습니다");
  const header = rows[0].map((h) => h.trim());
  const records: RawRecord[] = rows.slice(1).map((cells, i) => {
    const values: Record<string, unknown> = {};
    header.forEach((h, c) => {
      if (c < cells.length) values[h] = cells[c];
    });
    return { where: `파일 ${i + 2}행`, values };
  });
  return { kind: "csv", header, records, metadata: null };
}

export function parseJson(text: string): ParsedFile {
  let data: unknown;
  try {
    data = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch {
    throw new ParseError("JSON 형식이 올바르지 않습니다");
  }
  const list = Array.isArray(data) ? data : (data as { records?: unknown })?.records;
  if (!Array.isArray(list)) throw new ParseError("JSON에서 records 목록을 찾을 수 없습니다");
  const metadata =
    !Array.isArray(data) && typeof (data as { metadata?: unknown }).metadata === "object"
      ? ((data as { metadata: Record<string, unknown> }).metadata ?? null)
      : null;
  const records: RawRecord[] = list.map((item, i) => ({
    where: `기록 ${i + 1}번째`,
    values: item && typeof item === "object" ? (item as Record<string, unknown>) : {},
  }));
  return { kind: "json", header: null, records, metadata };
}

export function parseFileText(fileName: string, text: string): ParsedFile {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return parseCsv(text);
  if (lower.endsWith(".json")) return parseJson(text);
  throw new ParseError("CSV 또는 JSON 파일만 가져올 수 있습니다");
}
