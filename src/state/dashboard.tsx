"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { allMonths } from "@/lib/calc";
import { normalizeFilter } from "@/lib/filter";
import { ALL, LAST_MONTH, type Filter, type SiteRow } from "@/lib/types";

export const DEFAULT_FILTER: Filter = { month: LAST_MONTH, region: ALL, projectType: ALL, siteId: ALL };

interface DashboardState {
  rows: SiteRow[] | null; // 지금 자료. 없으면 null
  sourceName: string | null;
  filter: Filter;
  months: string[];
  notice: string | null;
  focusSiteId: string | null; // 점검 순위에서 눌러 비교표로 넘어온 현장
  replaceData: (rows: SiteRow[], sourceName: string) => void;
  setFilter: (patch: Partial<Filter>) => void;
  resetFilter: () => void;
  showNotice: (message: string) => void;
  clearNotice: () => void;
  setFocus: (siteId: string | null) => void;
}

const Ctx = createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<SiteRow[] | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [filter, setFilterState] = useState<Filter>(DEFAULT_FILTER);
  const [notice, setNotice] = useState<string | null>(null);
  const [focusSiteId, setFocusSiteId] = useState<string | null>(null);

  const months = useMemo(() => (rows ? allMonths(rows) : []), [rows]);

  // 검사를 통과한 새 자료로 한 번에 교체한다(누적하지 않음)
  const replaceData = useCallback((next: SiteRow[], name: string) => {
    const nextMonths = allMonths(next);
    setRows(next);
    setSourceName(name);
    setNotice(null);
    setFocusSiteId(null);
    setFilterState({
      ...DEFAULT_FILTER,
      month: nextMonths.includes(LAST_MONTH) ? LAST_MONTH : nextMonths[nextMonths.length - 1],
    });
  }, []);

  const setFilter = useCallback(
    (patch: Partial<Filter>) => {
      const merged = { ...filter, ...patch };
      setFocusSiteId(null);
      if (!rows) {
        setFilterState(merged);
        return;
      }
      const { filter: next, siteReset } = normalizeFilter(rows, merged);
      setFilterState(next);
      setNotice(siteReset ? "선택한 현장이 새 범위에 없어서 현장 선택을 '전체'로 되돌렸습니다." : null);
    },
    [rows, filter],
  );

  const resetFilter = useCallback(() => {
    setNotice(null);
    setFocusSiteId(null);
    setFilterState({
      ...DEFAULT_FILTER,
      month: months.includes(LAST_MONTH) ? LAST_MONTH : (months[months.length - 1] ?? LAST_MONTH),
    });
  }, [months]);

  const showNotice = useCallback((message: string) => setNotice(message), []);
  const clearNotice = useCallback(() => setNotice(null), []);
  const setFocus = useCallback((siteId: string | null) => setFocusSiteId(siteId), []);

  const value = useMemo(
    () => ({ rows, sourceName, filter, months, notice, focusSiteId, replaceData, setFilter, resetFilter, showNotice, clearNotice, setFocus }),
    [rows, sourceName, filter, months, notice, focusSiteId, replaceData, setFilter, resetFilter, showNotice, clearNotice, setFocus],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardState {
  const v = useContext(Ctx);
  if (!v) throw new Error("DashboardProvider 안에서만 쓸 수 있습니다");
  return v;
}
