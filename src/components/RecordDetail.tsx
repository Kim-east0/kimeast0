import { monthLabel } from "@/lib/format";
import type { SiteRow } from "@/lib/types";

// 비교표 펼침 행: 공사기간·기록된 상황·계획된 대응
export function RecordDetail({ r }: { r: SiteRow }) {
  return (
    <div className="detail">
      <div className="d-box">
        <h3>공사기간</h3>
        <p className="num">{r.startDate} ~ {r.contractEndDate}</p>
        <p className="caption">계약상 준공일은 예정 일정이며 실제 완료일·예측일이 아닙니다.</p>
      </div>
      <div className="d-box">
        <h3>기록된 상황 <span className="caption">({monthLabel(r.month)} · issueSummary)</span></h3>
        <p>{r.issueSummary}</p>
        <p className="caption">특이사항 분류: {r.issueCategory} (상태 판정에는 쓰지 않는 현장 기록 분류)</p>
      </div>
      <div className="d-box">
        <h3>계획된 대응 <span className="caption">(actionPlan)</span></h3>
        <p>{r.actionPlan}</p>
        <p className="caption">예정된 대응이며 완료·효과를 뜻하지 않습니다.</p>
      </div>
    </div>
  );
}
