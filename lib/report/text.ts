// 보고서를 복사해서 붙일 수 있는 글(텍스트)로 바꾼다. 화면에 보이는 양식과 같은 순서·표현을 쓴다.
import { formatScore } from "@/lib/survey/format";
import type { ItemStat, Report } from "@/lib/report/types";

const itemText = (item: ItemStat) => `${item.label} ${formatScore(item.mean)}점`;

export function reportTitle(report: Report): string {
  const { scopeLabel, year, centerName } = report.facts;
  // "2026년 3분기"처럼 이미 연도가 들어 있으면 연도를 또 붙이지 않는다.
  const when = /\d{4}년/.test(scopeLabel) ? scopeLabel : `${year}년 ${scopeLabel}`;
  return `${when} ${centerName ? `${centerName} 센터` : "전체 센터"} 경제교육 만족도 조사 결과 보고서`;
}

/** 직전 회차 대비 변화를 "+0.3점 상승" 형태의 글로 */
export function deltaText(report: Report): string {
  const p = report.facts.previous;
  if (!p) return "비교할 직전 회차 없음";
  const d = Math.round(p.delta * 10) / 10;
  return `${p.label} 대비 ${d > 0 ? "+" : ""}${d.toFixed(1)}점 ${d > 0 ? "상승" : d < 0 ? "하락" : "변동 없음"}`;
}

export function reportPeriod(report: Report): string {
  const { firstEducationDate: first, lastEducationDate: last } = report.facts;
  const range = first && last ? (first === last ? first : `${first} ~ ${last}`) : "교육일 정보 없음";
  return `${report.facts.scopeLabel} 교육 (교육일 ${range}) 수강생`;
}

export function reportToText(report: Report): string {
  const { facts, narrative } = report;
  const overall = facts.overallAverage === null ? "산출 불가 (응답 부족)" : `${formatScore(facts.overallAverage)} / 5.0점 (평가 등급: ${facts.grade})`;
  const s = facts.sentiment;
  const pct = (n: number) => (s.total === 0 ? 0 : Math.round((n / s.total) * 100));
  const lines = [
    reportTitle(report),
    ...(narrative.headline ? [`▶ ${narrative.headline}`] : []),
    "",
    "1. 조사 개요",
    ` - 대상/기간: ${reportPeriod(report)}`,
    ` - 응답 인원: ${facts.totalResponses}명 (${facts.participatingCenters}개 지역센터 참여)`,
    ` - 종합 만족도: ${overall}`,
    ` - 직전 회차 비교: ${deltaText(report)}`,
    ` - 서술 의견 감성 분석: 긍정 ${pct(s.positive)}% / 부정 ${pct(s.negative)}% / 중립 ${pct(s.neutral)}% (서술 ${s.total}건, 키워드 기준)`,
    "",
    "2. 주요 분석 결과 (IPA & 정량/정성 종합)",
    " 가. 우수 성과 영역 (Keep)",
    ...narrative.keep.map((k) => `  - ${k.title}: ${k.detail}`),
    " 나. 핵심 집중 개선 영역 (Critical Fix)",
    ...narrative.fix.map((k, i) => `  - [${i + 1}순위] ${k.title}: ${k.detail}`),
    ` 다. ${facts.breakdownKind === "course" ? "교육별" : "센터별"} 주요 갭(Gap) 분석`,
    `  - 우수 사례: ${narrative.gap.bestCase}`,
    `  - 공통 개선 요구사항: ${narrative.gap.commonIssue}`,
    "",
    "3. 정책 시사점 및 차기 추진 계획 (Action Plan)",
    ` - 추진과제 1 - 본부 차원: ${narrative.actions.headquarters}`,
    ` - 추진과제 2 - 센터 차원: ${narrative.actions.center}`,
    "",
    "4. 대표 수강생 의견",
    ` - 긍정: ${narrative.voice.positive ? `"${narrative.voice.positive}"` : "해당 의견 없음"}`,
    ` - 개선: ${narrative.voice.improve ? `"${narrative.voice.improve}"` : "해당 의견 없음"}`,
    "",
    `※ ${facts.breakdownKind === "course" ? "교육별" : "센터별"} 평균: ${facts.breakdown.map((b) => `${b.name} ${b.average === null ? `응답 부족(${b.responseCount}건)` : `${formatScore(b.average)}점`}`).join(" / ")}`,
    `※ 문항별 만족도: ${facts.items.map(itemText).join(" / ")}`,
  ];
  return lines.join("\n");
}
