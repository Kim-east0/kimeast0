import Link from "next/link";

// 처음 열었을 때(자료 없음) 상태
export function EmptyData({ what }: { what?: string }) {
  return (
    <div className="card empty" role="status">
      <h2>자료 없음</h2>
      <p>{what ?? "아직 가져온 자료가 없습니다."} 먼저 자료를 가져와 주세요.</p>
      <Link href="/import" className="link-btn">자료 가져오기</Link>
    </div>
  );
}
