// Design Ref: §4.3 — 점수는 표시할 때만 소수점 첫째 자리로 반올림한다. (계산 중에는 반올림하지 않는다)

/** 센터 이름("경기")을 화면에 쓰는 정식 표기("경기 지역경제교육센터")로 바꾼다. */
export function centerTitle(name: string): string {
  return `${name} 지역경제교육센터`;
}

/** 점수 단계: 색과 글자로 함께 알려 준다. (색만으로 구분하지 않는다) */
export type ScoreLevel = { key: "great" | "ok" | "warn" | "bad"; label: string; range: string };

export const SCORE_LEVELS: ScoreLevel[] = [
  { key: "great", label: "우수", range: "4.2 이상" },
  { key: "ok", label: "보통", range: "3.6 ~ 4.2 미만" },
  { key: "warn", label: "주의", range: "3.0 ~ 3.6 미만" },
  { key: "bad", label: "개선 필요", range: "3.0 미만" },
];

export function scoreLevel(value: number): ScoreLevel {
  const rounded = roundScore(value);
  if (rounded >= 4.2) return SCORE_LEVELS[0];
  if (rounded >= 3.6) return SCORE_LEVELS[1];
  if (rounded >= 3.0) return SCORE_LEVELS[2];
  return SCORE_LEVELS[3];
}

/** 대시보드 제목: 센터 담당자는 "내 센터 교육 현황", 경제교육정책팀 담당자는 "지역경제교육센터 교육 현황" */
export function dashboardTitle(role: "center" | "company"): string {
  return role === "company" ? "지역경제교육센터 교육 현황" : "내 센터 교육 현황";
}

/** 4.35 같은 값이 2진수 오차로 4.3이 되지 않도록 아주 작은 값을 더해 반올림한다. */
/** 서버에서 화면으로 내려보내기 전에 소수점 첫째 자리로 맞춘다. (정밀한 값이 화면 데이터에 남지 않게 한다) */
export function roundScore(value: number): number {
  return Math.round(value * 10 + 1e-9) / 10;
}

export function formatScore(value: number): string {
  return (Math.round(value * 10 + 1e-9) / 10).toFixed(1);
}
