// 결과 보고서의 데이터 모양. 서버(작성)와 화면(표시·복사)이 함께 쓰므로 비밀 값이나 서버 전용 코드를 넣지 않는다.

/** IPA(중요도-만족도) 분석에 쓰는 문항 하나의 값 */
export type ItemStat = {
  number: number;
  label: string;
  /** 문항 평균 (만족도) */
  mean: number;
  /** 전반적 만족도(Q8)와의 상관: 클수록 전반적 만족도에 영향이 큰 항목 (파생 중요도) */
  importance: number;
};

export type Sentiment = {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
};

/** 비교 막대에 쓰는 한 줄: 전체 센터를 볼 때는 센터, 센터 하나를 볼 때는 교육 */
export type CenterRow = {
  name: string;
  responseCount: number;
  /** 응답이 충분하지 않으면 null */
  average: number | null;
};

/** 코드가 직접 계산한 숫자 부분 (AI가 만들지 않는다) */
export type ReportFacts = {
  /** 예: "2026년 3분기" 또는 "전체 회차" */
  scopeLabel: string;
  /** 센터 하나를 골랐으면 그 센터 이름, 전체 센터이면 null */
  centerName: string | null;
  /** breakdown 한 줄이 센터인지 교육인지 */
  breakdownKind: "center" | "course";
  /** 직전 회차와 비교 (회차를 골랐고 직전 회차에 비교할 값이 있을 때만) */
  previous: { label: string; average: number; delta: number } | null;
  year: number;
  /** 교육일 범위 (YYYY-MM-DD) */
  firstEducationDate: string | null;
  lastEducationDate: string | null;
  totalResponses: number;
  participatingCenters: number;
  qualifiedCenters: number;
  overallAverage: number | null;
  grade: string;
  sentiment: Sentiment;
  breakdown: CenterRow[];
  items: ItemStat[];
  keepItems: ItemStat[];
  fixItems: ItemStat[];
};

/** AI가 문장으로 쓴 부분 (숫자는 facts에서 가져온 것만 쓰게 한다) */
export type ReportNarrative = {
  /** 결론 한 줄 (보고서 맨 위) */
  headline: string;
  keep: { title: string; detail: string }[];
  fix: { title: string; detail: string }[];
  gap: { bestCase: string; commonIssue: string };
  actions: { headquarters: string; center: string };
  voice: { positive: string | null; improve: string | null };
};

export type Report = {
  facts: ReportFacts;
  narrative: ReportNarrative;
  createdAt: string;
};
