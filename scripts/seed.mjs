// 개발용 샘플 데이터를 넣는다. 실행: npm run seed
// Design Ref: §5 — 센터·회차·링크·응답·담당자 계정 샘플. 운영 DB에는 실행하지 않는다.
// 계정 비밀번호는 .env의 SEED_ACCOUNT_PASSWORD에서 읽고, 암호문(해시)으로만 저장한다.

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SECRET_KEY, SEED_ACCOUNT_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !SEED_ACCOUNT_PASSWORD) {
  console.error(".env에 SUPABASE_URL, SUPABASE_SECRET_KEY, SEED_ACCOUNT_PASSWORD가 필요합니다.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

// 이미 샘플 데이터가 있으면 다시 넣지 않는다.
const { count } = await db.from("centers").select("*", { count: "exact", head: true });
if (count && count > 0) {
  console.log("이미 샘플 데이터가 있어 건너뜁니다.");
  process.exit(0);
}

// 같은 값이 나오는 난수 (샘플 데이터를 다시 만들어도 모양이 비슷하도록)
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
const random = makeRandom(20261015);

const GOOD_COMMENTS = [
  "실생활 사례로 설명해 주셔서 이해하기 쉬웠습니다.",
  "게임으로 배우는 시간이 가장 재미있었습니다.",
  "강사님이 질문에 친절하게 답해 주셨어요.",
  "용돈 관리하는 방법을 알게 되어 도움이 됐습니다.",
  "교재가 보기 편하고 정리가 잘 되어 있었습니다.",
  "",
];
const IMPROVE_COMMENTS = [
  "실습 시간이 조금 더 길었으면 좋겠습니다.",
  "교육장이 조금 더워서 에어컨이 필요했습니다.",
  "쉬는 시간이 짧아서 아쉬웠어요.",
  "난이도가 높은 부분은 예시가 더 있으면 좋겠습니다.",
  "",
  "",
];

const pick = (list) => list[Math.floor(random() * list.length)];
// 점수는 4점 안팎으로 나오게 한다 (3~5점 위주, 가끔 2점)
const score = () => {
  const r = random();
  return r < 0.05 ? 2 : r < 0.25 ? 3 : r < 0.65 ? 4 : 5;
};

// 마감 시각 = 교육일 + 14일, 한국 시간 23:59:59
function closesAt(educationDate) {
  const d = new Date(`${educationDate}T00:00:00+09:00`);
  d.setDate(d.getDate() + 14);
  const ymd = new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  return `${ymd}T23:59:59+09:00`;
}

const CENTER_NAMES = ["경기", "부산", "대전", "서울"];
// 회차 이름은 센터 공통. 3분기는 마감이 지났고, 4분기는 진행 중이다.
const ROUNDS = [
  { roundName: "2026년 3분기", educationDate: "2026-09-10" },
  { roundName: "2026년 4분기", educationDate: "2026-10-12" },
];
// 센터별·회차별 응답 수. 부산 3분기는 5건 미만("응답 부족" 확인용)
// 교육 이름(가상): 센터·회차마다 하나
const COURSE_NAMES = {
  경기: ["청소년 금융 체험 캠프", "청소년 창업·경제 리더 캠프"],
  부산: ["직장인 재테크 기초 과정", "사회초년생 첫 월급 관리 교실"],
  대전: ["시니어 금융사기 예방 교육", "은퇴 설계와 연금 이해 과정"],
  서울: ["대학생 경제·금융 입문 과정", "신혼부부 내 집 마련 금융 설계"],
};

const RESPONSE_COUNTS = {
  경기: [24, 7],
  부산: [3, 5],
  대전: [12, 2],
  서울: [0, 0],
};

const { data: centers, error: centerError } = await db
  .from("centers")
  .insert(CENTER_NAMES.map((name) => ({ name })))
  .select();
if (centerError) throw centerError;

const links = [];
for (const center of centers) {
  for (const [roundIndex, round] of ROUNDS.entries()) {
    const { data: session, error: sessionError } = await db
      .from("sessions")
      .insert({
        center_id: center.id,
        round_name: round.roundName,
        course_name: COURSE_NAMES[center.name][roundIndex],
        education_date: round.educationDate,
      })
      .select()
      .single();
    if (sessionError) throw sessionError;

    // 링크 주소에 들어갈 추측하기 어려운 무작위 값 (128비트)
    const linkId = randomBytes(16).toString("base64url");
    const { error: linkError } = await db.from("survey_links").insert({
      id: linkId,
      session_id: session.id,
      closes_at: closesAt(round.educationDate),
    });
    if (linkError) throw linkError;
    links.push({ center: center.name, round: round.roundName, linkId });

    const responseCount = RESPONSE_COUNTS[center.name][roundIndex];
    const rows = Array.from({ length: responseCount }, () => {
      const submitted = new Date(`${round.educationDate}T10:00:00+09:00`);
      submitted.setMinutes(submitted.getMinutes() + Math.floor(random() * 60 * 24 * 5));
      return {
        link_id: linkId,
        q1: score(), q2: score(), q3: score(), q4: score(),
        q5: score(), q6: score(), q7: score(), q8: score(),
        q9: pick(GOOD_COMMENTS),
        q10: pick(IMPROVE_COMMENTS),
        submitted_at: submitted.toISOString(),
      };
    });
    if (rows.length > 0) {
      const { error: responseError } = await db.from("responses").insert(rows);
      if (responseError) throw responseError;
    }
  }
}

// 담당자 계정: 회사 1개 + 센터마다 1개
const passwordHash = await bcrypt.hash(SEED_ACCOUNT_PASSWORD, 12);
const centerId = Object.fromEntries(centers.map((c) => [c.name, c.id]));
const accounts = [
  { username: "rudwprydbr", role: "company", center_id: null },
  { username: "rudrl", role: "center", center_id: centerId["경기"] },
  { username: "qntks", role: "center", center_id: centerId["부산"] },
  { username: "eowjs", role: "center", center_id: centerId["대전"] },
  { username: "tjdnf", role: "center", center_id: centerId["서울"] },
].map((account) => ({ ...account, password_hash: passwordHash }));
const { error: userError } = await db.from("app_users").insert(accounts);
if (userError) throw userError;

console.log("샘플 데이터를 넣었습니다.");
console.log("계정 아이디: rudwprydbr(회사), rudrl, qntks, eowjs, tjdnf(센터) / 비밀번호: .env의 SEED_ACCOUNT_PASSWORD");
console.log("설문 링크 (개발 서버 기준):");
for (const link of links) {
  console.log(`  ${link.center} · ${link.round} → /survey/${link.linkId}`);
}
