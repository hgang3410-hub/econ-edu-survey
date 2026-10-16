// Design Ref: §4 — 화면과 서버가 함께 쓰는 공통 규칙 값을 한곳에 모은다.

/** 평균·비교 차트를 보여 주려면 필요한 최소 응답 수 (미만이면 "응답 부족") */
export const MIN_RESPONSES_FOR_STATS = 5;

/** 설문 링크 마감: 교육일 + 이 일수, 한국 시간 23:59:59까지 */
export const LINK_VALID_DAYS = 14;

/** 한 링크가 1분 동안 받을 수 있는 응답 수 (대량 제출 방어). 한 반이 수업 끝에 한꺼번에 내도 넘지 않을 만큼 넉넉히 잡는다. 중복 제출 자체는 막지 않는다. */
export const MAX_RESPONSES_PER_LINK_PER_MINUTE = 120;

/** 로그인 연속 실패 허용 횟수와 잠금 시간(분) */
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MINUTES = 15;

/** 로그인 유지 시간(시간) */
export const SESSION_HOURS = 8;

/** 센터 담당자에게 "전체 평균"을 보여 주려면 필요한 최소 센터 수. 적으면 다른 센터의 평균을 거꾸로 알아낼 수 있다. */
export const MIN_CENTERS_FOR_OVERALL_AVERAGE = 3;

/** 요약 화면의 "전체 회차" 값 (요약 저장 시 회차 이름 칸에 쓰는 예약값. 실제 회차 이름과 겹치지 않게 한다) */
export const ALL_ROUNDS_LABEL = "__all_rounds__";
