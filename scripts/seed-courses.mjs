// 샘플 교육을 더 넣어서 "회차별"과 "교육별" 분석이 서로 다르게 보이게 한다. 실행: npm run seed:courses
// - 센터마다 한 회차에 교육이 2개씩 있고, 같은 교육이 3분기와 4분기에 모두 열린 모양이 된다.
// - 같은 교육도 회차마다 점수가 달라서(개선된 곳, 그대로인 곳) 교육 간·회차 간 비교가 의미 있게 나온다.
// 개발용 샘플 데이터이므로 운영 DB에는 실행하지 않는다. (이미 넣었으면 건너뛴다)

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(".env에 SUPABASE_URL, SUPABASE_SECRET_KEY가 필요합니다.");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

function makeRandom(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = makeRandom(424242);
const normal = () => Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());
const pick = (list) => list[Math.floor(random() * list.length)];
const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));
const WEIGHT = [0.5, 0.45, 0.5, 0.8, 0.75, 0.3, 0.8, 1.0]; // 전반적 만족도(Q8)와 함께 움직이는 정도

// 교육마다 특징적인 서술 의견 (센터 공통 의견에 더해 쓴다)
const COURSE_COMMENTS = {
  "학부모 경제 교실": {
    good: ["아이에게 용돈 교육을 어떻게 시작할지 구체적으로 알려 주셔서 좋았습니다.", "또래 부모님들과 고민을 나눌 수 있어 도움이 됐어요."],
    improve: ["평일 낮 시간이라 직장 다니는 부모는 참석하기 어려웠습니다. 저녁이나 주말 과정이 있으면 좋겠습니다.", "자녀 나이별 사례가 더 있었으면 합니다.", "아이를 데려올 수 없어서 돌봄 공간이 있으면 좋겠습니다."],
  },
  "청소년 금융 체험 캠프": {
    good: ["모의 투자 게임이 가장 재미있었고 친구들과 팀으로 하니 더 좋았어요.", "직접 가계부를 써 보는 활동이 기억에 남아요."],
    improve: ["점심 시간이 짧아서 오후 활동에 집중하기 어려웠어요.", "모둠 인원이 많아서 참여 못 한 친구가 있었어요."],
  },
  "사회초년생 첫 월급 관리 교실": {
    good: ["첫 월급 예산표를 직접 만들어 보는 실습이 아주 실용적이었습니다.", "청약·적금 비교를 한눈에 볼 수 있었어요."],
    improve: ["실습 시간이 부족해서 예산표를 끝까지 못 만들었습니다.", "퇴근 후 시간대(저녁 7시 이후)에도 열어 주세요."],
  },
  "직장인 재테크 기초 과정": {
    good: ["연말정산과 세액공제 설명이 정말 도움이 됐습니다.", "펀드·ETF 차이를 쉽게 정리해 주셔서 좋았어요."],
    improve: ["투자 상품 설명이 빨라서 메모하기 바빴습니다.", "자료를 사전에 보내 주시면 좋겠습니다."],
  },
  "은퇴 설계와 연금 이해 과정": {
    good: ["국민연금·퇴직연금 차이를 처음 제대로 이해했습니다.", "내 연금 예상액을 직접 계산해 볼 수 있어 좋았습니다."],
    improve: ["용어가 어려워서 따라가기 힘들었습니다. 쉬운 말로 풀어 주세요.", "글씨가 작은 자료는 어르신들이 보기 힘듭니다."],
  },
  "시니어 금융사기 예방 교육": {
    good: ["보이스피싱 사례를 직접 들려주셔서 경각심이 생겼어요.", "스미싱 문자 구분법을 알게 되어 유익했습니다."],
    improve: ["대응 요령을 실습해 보는 시간이 있으면 좋겠습니다.", "강의 속도가 조금 빨랐습니다."],
  },
  "신혼부부 내 집 마련 금융 설계": {
    good: ["대출 한도와 금리 시뮬레이션이 정말 현실적이었습니다.", "청약 전략을 단계별로 알려 주셔서 도움이 됐어요."],
    improve: ["교재의 표가 흑백이고 글씨가 작아 읽기 힘들었습니다.", "대출 상품 비교 자료가 최신이 아닌 것 같았습니다."],
  },
  "대학생 경제·금융 입문 과정": {
    good: ["신용점수 관리법을 알게 되어 유익했습니다.", "알바 소득 관리와 4대 보험 설명이 도움이 됐어요."],
    improve: ["강의실이 너무 더웠고 환기가 안 됐습니다.", "마이크 소리가 울려서 뒤쪽에서는 잘 안 들렸어요.", "좌석이 좁아 필기하기 불편했습니다."],
  },
  "청소년 창업·경제 리더 캠프": { good: [], improve: [] },
};

// 센터 공통 의견 (scripts/seed-more.mjs와 같은 성격)
const CENTER_GOOD = {
  경기: ["강사님이 사례를 들어 설명해 주셔서 쉽게 이해했습니다.", "질문하면 바로바로 답해 주셔서 좋았어요."],
  부산: ["강사님의 전달력이 정말 좋았습니다.", "실생활과 연결된 예시가 많아서 도움이 됐습니다."],
  대전: ["시설이 쾌적하고 자리가 편했습니다.", "진행 요원분들이 친절하게 안내해 주셨습니다."],
  서울: ["강사님이 열정적이셔서 분위기가 좋았습니다.", "교육 주제 자체는 흥미로웠습니다."],
};
const CENTER_IMPROVE = {
  경기: ["쉬는 시간이 조금 더 길었으면 좋겠습니다.", "", ""],
  부산: ["체험 활동 시간이 너무 짧았습니다.", "실습 준비물이 부족했습니다.", ""],
  대전: ["이론 설명이 빠르고 어려웠습니다. 예시를 더 넣어 주세요.", "강의 자료를 미리 공유해 주면 좋겠습니다."],
  서울: ["교육장이 너무 더웠고 환기가 되지 않았습니다.", "교재 글씨가 작고 흑백이라 보기 어려웠습니다.", "시작 시간이 계속 늦어졌습니다."],
};

// 추가할 교육: 같은 교육이 3분기·4분기에 모두 열리고, 회차마다 점수가 달라진다.
const NEW_SESSIONS = [
  { center: "경기", round: "2026년 3분기", course: "학부모 경제 교실", date: "2026-09-17", count: 12, base: [4.1, 4.0, 3.7, 3.3, 4.0, 3.6, 3.2, 3.7] },
  { center: "경기", round: "2026년 4분기", course: "청소년 금융 체험 캠프", date: "2026-10-14", count: 11, base: [4.7, 4.4, 4.4, 4.7, 4.7, 4.4, 4.3, 4.7] },
  { center: "부산", round: "2026년 3분기", course: "사회초년생 첫 월급 관리 교실", date: "2026-09-18", count: 13, base: [4.2, 4.1, 4.0, 3.2, 4.4, 4.0, 3.9, 3.9] },
  { center: "부산", round: "2026년 4분기", course: "직장인 재테크 기초 과정", date: "2026-10-14", count: 10, base: [4.1, 4.0, 3.9, 3.7, 4.3, 3.9, 3.7, 4.0] },
  { center: "대전", round: "2026년 3분기", course: "은퇴 설계와 연금 이해 과정", date: "2026-09-16", count: 12, base: [3.7, 3.2, 3.0, 3.5, 3.6, 3.8, 4.0, 3.3] },
  { center: "대전", round: "2026년 4분기", course: "시니어 금융사기 예방 교육", date: "2026-10-13", count: 10, base: [4.3, 4.0, 3.9, 4.1, 4.2, 4.0, 4.2, 4.2] },
  { center: "서울", round: "2026년 3분기", course: "신혼부부 내 집 마련 금융 설계", date: "2026-09-19", count: 12, base: [4.0, 3.8, 4.0, 3.6, 3.9, 2.6, 3.2, 3.7] },
  { center: "서울", round: "2026년 4분기", course: "대학생 경제·금융 입문 과정", date: "2026-10-14", count: 10, base: [3.6, 3.5, 3.8, 3.7, 3.9, 2.8, 2.4, 3.3] },
];

const { data: existing } = await db.from("sessions").select("id").eq("course_name", NEW_SESSIONS[0].course).eq("round_name", NEW_SESSIONS[0].round);
if (existing && existing.length > 0) {
  console.log("교육 샘플이 이미 있어 건너뜁니다.");
  process.exit(0);
}

const { data: centers, error: centerError } = await db.from("centers").select("id, name");
if (centerError) throw centerError;
const centerId = Object.fromEntries(centers.map((c) => [c.name, c.id]));

// 마감 = 교육일 + 14일, 한국 시간 23:59:59
function closesAt(date) {
  const d = new Date(`${date}T00:00:00+09:00`);
  d.setDate(d.getDate() + 14);
  return `${new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)}T23:59:59+09:00`;
}

let total = 0;
for (const item of NEW_SESSIONS) {
  const { data: session, error: sessionError } = await db
    .from("sessions")
    .insert({ center_id: centerId[item.center], round_name: item.round, course_name: item.course, education_date: item.date })
    .select()
    .single();
  if (sessionError) throw sessionError;

  const linkId = randomBytes(16).toString("base64url");
  const { error: linkError } = await db.from("survey_links").insert({ id: linkId, session_id: session.id, closes_at: closesAt(item.date) });
  if (linkError) throw linkError;

  const start = new Date(`${item.date}T10:00:00+09:00`).getTime();
  const end = Math.min(Date.now(), start + 12 * 24 * 3600 * 1000);
  const extra = COURSE_COMMENTS[item.course];
  const rows = Array.from({ length: item.count }, () => {
    const mood = normal() * 0.8;
    const scores = item.base.map((b, k) => clamp(b + WEIGHT[k] * mood + normal() * 0.45));
    const satisfaction = scores.reduce((s, v) => s + v, 0) / scores.length;
    const writesImprove = random() < (satisfaction < 3.3 ? 0.9 : satisfaction < 4 ? 0.65 : 0.4);
    const writesGood = random() < (satisfaction < 3 ? 0.4 : 0.85);
    return {
      link_id: linkId,
      q1: scores[0], q2: scores[1], q3: scores[2], q4: scores[3], q5: scores[4], q6: scores[5], q7: scores[6], q8: scores[7],
      q9: writesGood ? pick([...extra.good, ...extra.good, ...CENTER_GOOD[item.center]]) : "",
      q10: writesImprove ? pick([...extra.improve, ...extra.improve, ...CENTER_IMPROVE[item.center]]) : "",
      submitted_at: new Date(start + random() * (end - start)).toISOString(),
    };
  });
  const { error } = await db.from("responses").insert(rows);
  if (error) throw error;
  total += rows.length;
}
console.log(`교육 ${NEW_SESSIONS.length}개와 응답 ${total}건을 더 넣었습니다.`);
