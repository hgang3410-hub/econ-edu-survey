// Design Ref: §5 — 센터·교육 회차·설문 링크·응답·담당자 계정·요약의 데이터 구조(타입)를 이 파일 한 곳에서 정의한다.
// 관계: 센터 1 ─ N 교육 회차 1 ─ 1 설문 링크 1 ─ N 응답 / 센터 1 ─ N 담당자 계정 (회사 담당자는 센터 없음)
// 날짜·시각은 저장소(Supabase)와 주고받기 쉽도록 문자열로 둔다.
//   - 날짜: "2026-10-15" (YYYY-MM-DD)
//   - 시각: "2026-10-29T14:59:59Z" (ISO 8601)

import type {
  CommentQuestionNumber,
  ScoreQuestionNumber,
} from "@/lib/survey/questions";

/** 지역경제교육센터 */
export type Center = {
  id: string;
  name: string;
};

/**
 * 교육 회차.
 * 회차 이름은 센터 공통이다 (예: "2026년 3분기"). 같은 이름이면 같은 회차로 묶어 센터끼리 비교한다.
 */
export type Session = {
  id: string;
  centerId: string;
  /** 센터 공통 회차 이름 */
  roundName: string;
  /** 교육 이름(프로그램명). 예: "청소년 금융 체험 캠프" */
  courseName: string;
  /** 교육일 (YYYY-MM-DD) */
  educationDate: string;
};

/**
 * 설문 링크. 교육 1회(회차)당 1개이며, 링크 주소에 들어가는 값이 id이다.
 * 센터와 회차는 이 링크로 정해지므로 수강생은 아무 정보도 입력하지 않는다.
 */
export type SurveyLink = {
  /** 링크 주소에 들어가는, 추측하기 어려운 긴 무작위 값 */
  id: string;
  sessionId: string;
  /** 마감 시각. 기본값은 교육일 + 14일, 한국 시간 23:59:59 */
  closesAt: string;
};

/**
 * 수강생 응답 1건.
 * 이름·연락처·소속기관은 물론 IP·접속 기기 정보도 두지 않는다. 한 번 저장하면 수정·삭제하지 않는다.
 */
export type Response = {
  id: string;
  linkId: string;
  /** 정량 문항 1~8번 점수 (각각 1~5 정수) — DESIGN의 q1~q8 */
  scores: Record<ScoreQuestionNumber, number>;
  /** 정성 문항 9~10번 서술 (각각 0~500자, 쓰지 않으면 빈 문자열) — DESIGN의 q9, q10 */
  comments: Record<CommentQuestionNumber, string>;
  /** 제출 시각 */
  submittedAt: string;
};

/** 담당자 계정의 역할: 회사 담당자는 전체 센터, 센터 담당자는 자기 센터만 본다 */
export type UserRole = "company" | "center";

/** 담당자 계정. 미리 만들어 둔 계정만 사용하며 회원가입은 없다. */
export type User = {
  id: string;
  /** 로그인 아이디 */
  username: string;
  /** 비밀번호는 원문이 아니라 암호문(해시)으로만 저장한다 */
  passwordHash: string;
  role: UserRole;
  /** 센터 담당자의 센터. 회사 담당자는 null */
  centerId: string | null;
};

/** 서술 의견 AI 요약 저장용. 요약한 응답 수가 달라지면 새로 만든다. 서술 원문은 저장하지 않는다. */
export type Summary = {
  id: string;
  centerId: string;
  /** 요약 대상 회차 이름 */
  roundName: string;
  /** 요약을 만들 때의 응답 수 (이 값이 달라지면 요약을 다시 만든다) */
  responseCount: number;
  /** 요약 내용 */
  content: string;
  /** 요약을 만든 시각 */
  createdAt: string;
};
