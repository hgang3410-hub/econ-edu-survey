// 센터마다 만족도 수준과 약한 항목이 서로 다른 샘플 응답을 더 넣는다. 실행: npm run seed:more
// - 모든 센터·회차가 응답 5건 이상이 되게 해서 "응답 부족"이 나오지 않게 한다.
// - 센터별로 평균이 높거나 낮고, 개선 의견이 많은 센터도 있도록 다양하게 만든다.
// 개발용 샘플 데이터이므로 운영 DB에는 실행하지 않는다. (이미 응답이 충분하면 건너뛴다)

import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(".env에 SUPABASE_URL, SUPABASE_SECRET_KEY가 필요합니다.");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const { count } = await db.from("responses").select("*", { count: "exact", head: true });
if ((count ?? 0) >= 150) {
  console.log("응답이 이미 충분해서 건너뜁니다.");
  process.exit(0);
}

// 같은 값이 나오는 난수
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
const random = makeRandom(7777);
const normal = () => Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());
const pick = (list) => list[Math.floor(random() * list.length)];
const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));

// 문항이 전반적 만족도(Q8)와 함께 움직이는 정도 (클수록 응답자의 기분에 크게 좌우됨)
const WEIGHT = [0.5, 0.45, 0.5, 0.8, 0.75, 0.3, 0.8, 1.0];

// 센터별 문항 기준 점수(Q1~Q8). 낮은 항목이 그 센터의 약점이다.
const PROFILES = {
  경기: { base: [4.6, 4.4, 4.3, 4.5, 4.6, 4.2, 4.0, 4.5], rounds: { "2026년 3분기": 10, "2026년 4분기": 8 } },
  부산: { base: [4.0, 3.9, 3.8, 2.6, 4.3, 3.7, 3.6, 3.5], rounds: { "2026년 3분기": 12, "2026년 4분기": 10 } },
  대전: { base: [3.9, 3.0, 2.7, 3.6, 3.4, 3.8, 4.1, 3.4], rounds: { "2026년 3분기": 8, "2026년 4분기": 12 } },
  서울: { base: [3.4, 3.2, 3.5, 3.3, 3.6, 2.2, 2.0, 2.9], rounds: { "2026년 3분기": 14, "2026년 4분기": 12 } },
};

// 좋았던 점(Q9)·개선 요청(Q10) 문장: 센터의 약점이 개선 요청에 자주 나오도록 센터별로 나눠 둔다.
const GOOD = {
  경기: ["강사님이 사례를 들어 설명해 주셔서 쉽게 이해했습니다.", "게임으로 배우는 시간이 가장 재미있었습니다.", "교재 구성이 깔끔하고 순서가 잘 정리되어 있었습니다.", "질문하면 바로바로 답해 주셔서 좋았어요.", "용돈 관리와 저축 습관을 배울 수 있어서 유익했습니다.", "체험 활동으로 직접 해 보니 기억에 오래 남습니다."],
  부산: ["강사님의 전달력이 정말 좋았습니다.", "금융 용어를 쉬운 말로 풀어 주셔서 이해가 잘 됐어요.", "실생활과 연결된 예시가 많아서 도움이 됐습니다.", "질의응답 시간이 알찼습니다."],
  대전: ["시설이 쾌적하고 자리가 편했습니다.", "교재 자료가 보기 좋게 만들어져 있었습니다.", "진행 요원분들이 친절하게 안내해 주셨습니다.", "주제 선정이 현실적이라 좋았습니다."],
  서울: ["강사님이 열정적이셔서 분위기가 좋았습니다.", "경제 뉴스를 읽는 법을 알게 되어 유익했습니다.", "교육 주제 자체는 흥미로웠습니다."],
};
const IMPROVE = {
  경기: ["쉬는 시간이 조금 더 길었으면 좋겠습니다.", "마지막 정리 시간이 짧아서 아쉬웠어요.", "", "", "다음에는 심화 과정도 있으면 좋겠습니다."],
  부산: ["체험 활동 시간이 너무 짧았습니다. 직접 해 볼 시간을 더 주세요.", "실습 준비물이 부족해서 조원끼리 나눠 써야 했습니다.", "활동 설명이 빨라서 따라가기 어려웠어요.", "게임이나 워크숍을 더 늘려 주시면 좋겠습니다.", "실습 결과를 발표할 시간이 없었습니다."],
  대전: ["이론 설명이 너무 빠르고 어려웠습니다. 예시를 더 넣어 주세요.", "전문 용어가 많아서 처음 듣는 사람은 이해하기 힘들었습니다.", "강의 자료를 미리 공유해 주면 예습할 수 있을 것 같아요.", "난이도 구분 없이 같은 내용을 들어서 지루한 분도 있었습니다.", "이론 시간이 길어서 집중하기 어려웠습니다."],
  서울: ["교육장이 너무 더웠고 환기가 되지 않았습니다.", "마이크 소리가 울려서 강사님 말씀이 잘 안 들렸습니다.", "교재 글씨가 너무 작고 흑백이라 도표를 보기 어려웠습니다.", "좌석이 좁고 책상이 불편했습니다.", "시작 시간이 계속 늦어져서 마무리가 급하게 끝났습니다.", "교재에 오탈자가 많고 내용이 최신이 아닌 것 같습니다.", "주차 공간이 없어서 오는 길이 힘들었습니다.", "쉬는 시간 없이 이어져 힘들었습니다."],
};

// 센터·회차의 설문 링크 찾기
const { data: links, error: linkError } = await db
  .from("survey_links")
  .select("id, sessions!inner(round_name, education_date, centers!inner(name))")
  .returns();
if (linkError) throw linkError;

const rows = [];
for (const row of links) {
  const center = row.sessions.centers.name;
  const round = row.sessions.round_name;
  const profile = PROFILES[center];
  const total = profile?.rounds[round] ?? 0;
  const eduStart = new Date(`${row.sessions.education_date}T10:00:00+09:00`);
  const limit = Math.min(Date.now(), eduStart.getTime() + 12 * 24 * 3600 * 1000);

  for (let i = 0; i < total; i++) {
    const mood = normal() * 0.8; // 응답자 개인의 전반적 기분
    const scores = profile.base.map((b, k) => clamp(b + WEIGHT[k] * mood + normal() * 0.45));
    const satisfaction = scores.reduce((s, v) => s + v, 0) / scores.length;
    // 만족도가 낮을수록 개선 요청을 더 자주 쓴다.
    const writesImprove = random() < (satisfaction < 3.3 ? 0.9 : satisfaction < 4 ? 0.65 : 0.35);
    const writesGood = random() < (satisfaction < 3 ? 0.4 : 0.8);
    const submitted = new Date(eduStart.getTime() + random() * (limit - eduStart.getTime()));
    rows.push({
      link_id: row.id,
      q1: scores[0], q2: scores[1], q3: scores[2], q4: scores[3],
      q5: scores[4], q6: scores[5], q7: scores[6], q8: scores[7],
      q9: writesGood ? pick(GOOD[center]) : "",
      q10: writesImprove ? pick(IMPROVE[center]) : "",
      submitted_at: submitted.toISOString(),
    });
  }
}

const { error } = await db.from("responses").insert(rows);
if (error) throw error;
console.log(`샘플 응답 ${rows.length}건을 더 넣었습니다.`);
