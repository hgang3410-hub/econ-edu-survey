// Design Ref: §5 — 공통 설문 문항 10개는 이 파일 한 곳에서만 정의한다. (화면·서버 검사·집계가 모두 여기를 참조)
// Plan SC: 1 — 모든 센터가 동일한 문항과 5점 척도를 쓴다. 센터별로 문항을 바꾸는 기능은 만들지 않는다.

/** 점수 문항의 최소 점수 */
export const SCORE_MIN = 1;

/** 점수 문항의 최대 점수 (5점 척도) */
export const SCORE_MAX = 5;

/** 5점 척도 양쪽 끝의 안내 문구 (① 전혀 그렇지 않다 ~ ⑤ 매우 그렇다) */
export const SCORE_LABELS = {
  min: "전혀 그렇지 않다",
  max: "매우 그렇다",
} as const;

/** 서술 문항 하나에 입력할 수 있는 최대 글자 수 */
export const COMMENT_MAX_LENGTH = 500;

/** 서술 입력란 아래에 보여 줄 개인정보 안내 문구 */
export const COMMENT_PRIVACY_NOTICE = "개인정보는 적지 마세요";

/** 5점 척도로 답하는 정량 문항 */
export type ScoreQuestion = {
  /** 문항 번호 (1~8) */
  number: number;
  /** 문항이 속한 부문 */
  section: string;
  /** 문항의 짧은 이름 */
  label: string;
  /** 수강생에게 보여 줄 질문 */
  text: string;
};

/** 자유롭게 서술하는 정성 문항 */
export type CommentQuestion = {
  /** 문항 번호 (9~10) */
  number: number;
  /** 문항의 짧은 이름 */
  label: string;
  /** 수강생에게 보여 줄 질문 */
  text: string;
};

/** 정량 문항 8개 (1~8번) */
export const SCORE_QUESTIONS = [
  {
    number: 1,
    section: "교육 내용 및 커리큘럼",
    label: "과정 구성",
    text: "교육과정의 주제와 내용은 실생활 및 경제 이해도 향상에 유익했습니까?",
  },
  {
    number: 2,
    section: "교육 내용 및 커리큘럼",
    label: "수준 적절성",
    text: "교육 내용의 난이도와 설명 수준은 이해하기 적절했습니까?",
  },
  {
    number: 3,
    section: "세부 활동 만족도",
    label: "이론/특강",
    text: "강사의 설명 및 이론 강의 세션은 알차고 이해하기 쉬웠습니까?",
  },
  {
    number: 4,
    section: "세부 활동 만족도",
    label: "체험/실습 Activity",
    text: "교구 활용, 게임, 워크숍 등 세부 체험 활동은 흥미롭고 효과적이었습니까?",
  },
  {
    number: 5,
    section: "강사진 및 시설/운영",
    label: "강사 전문성",
    text: "강사의 전달력, 준비성 및 질의응답 대응에 만족합니까?",
  },
  {
    number: 6,
    section: "강사진 및 시설/운영",
    label: "교재/자료",
    text: "제공된 교육 교재 및 시각 자료의 가독성과 완성도에 만족합니까?",
  },
  {
    number: 7,
    section: "강사진 및 시설/운영",
    label: "시설/환경",
    text: "교육장 환경(음향, 조명, 좌석 등) 및 진행 방식(시간 준수, 쉬는 시간)은 쾌적했습니까?",
  },
  {
    number: 8,
    section: "종합 성과 및 추천",
    label: "전반적 만족도 & 추천",
    text: "본 교육과정에 전반적으로 만족하며, 주변 사람에게 추천할 의향이 있습니까?",
  },
] as const satisfies readonly ScoreQuestion[];

/** 정성(서술) 문항 2개 (9~10번) — AI 요약의 분석 대상 */
export const COMMENT_QUESTIONS = [
  {
    number: 9,
    label: "우수 요소",
    text: "이번 교육 과정(또는 세부 활동) 중 가장 좋았던 점이나 인상 깊었던 부분은 무엇입니까?",
  },
  {
    number: 10,
    label: "개선 요청",
    text: "향후 교육과정 개편 및 센터 운영을 위해 개선되었으면 하는 점이나 바라는 점이 있다면 자유롭게 기술해 주세요.",
  },
] as const satisfies readonly CommentQuestion[];

/** 정량 문항 번호 (1~8) */
export type ScoreQuestionNumber = (typeof SCORE_QUESTIONS)[number]["number"];

/** 정성 문항 번호 (9~10) */
export type CommentQuestionNumber = (typeof COMMENT_QUESTIONS)[number]["number"];
