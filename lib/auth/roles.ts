// 시작 화면에서 고르는 담당자 역할. 로그인 화면과 로그인 처리가 같은 값을 쓴다.
export type LoginRole = "center" | "company";

export const LOGIN_ROLES: Record<LoginRole, { label: string; summary: string }> = {
  center: { label: "지역경제교육센터 담당자", summary: "우리 센터의 교육 현황과 설문 링크를 확인합니다." },
  company: { label: "경제교육정책팀 담당자", summary: "모든 지역경제교육센터의 교육 현황을 비교합니다." },
};

export function parseLoginRole(value: unknown): LoginRole | null {
  return value === "center" || value === "company" ? value : null;
}
