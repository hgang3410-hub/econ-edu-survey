"use client";

// 경제교육정책팀 전용: 결과 보고서 만들기. 회차와 센터를 골라 그 범위만 분석하며, 화면에서 보고 복사하거나 인쇄(PDF 저장)할 수 있다.
import Image from "next/image";
import { useActionState, useState } from "react";
import { generateReport, type ReportState } from "@/app/actions/report";
import { Card } from "@/components/Card";
import { AlertIcon, ClipboardIcon } from "@/components/icons";
import { BAR_TONE } from "@/components/scoreTone";
import { deltaText, reportPeriod, reportTitle, reportToText } from "@/lib/report/text";
import type { Report } from "@/lib/report/types";
import { formatScore, scoreLevel } from "@/lib/survey/format";

const initialState: ReportState = { status: "idle" };
const reportDate = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long" });

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="border-b border-line pb-2 text-lg font-semibold">{title}</h4>
      {children}
    </section>
  );
}

/** 줄글을 읽기 편하게: 문단 사이를 띄우고 줄 간격을 넉넉하게 둔다. (점·줄표 없이 문단으로 보여 준다) */
function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="flex flex-col gap-3 leading-8 break-keep">
      {items.map((item, index) => (
        <p key={index}>{item}</p>
      ))}
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h5 className="mt-3 text-base font-semibold text-primary">{children}</h5>;
}

/** 핵심 숫자 한 칸 */
function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-background p-3">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-2xl font-semibold tabular-nums leading-tight ${tone ?? ""}`}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

/** 5점 만점 가로 막대 한 줄. 평균선(overall)을 함께 그려 높고 낮음을 바로 보이게 한다. */
function ScoreRow({ name, value, note, overall }: { name: string; value: number | null; note?: string; overall: number | null }) {
  // 휴대폰에서는 "이름 ··· 점수" 한 줄 아래에 막대를 길게 놓고, 넓은 화면에서는 한 줄에 나란히 놓는다.
  return (
    <li className="flex flex-col gap-1.5 text-sm sm:grid sm:grid-cols-[minmax(0,12rem)_1fr_6rem] sm:items-center sm:gap-3">
      <div className="flex items-baseline justify-between gap-3 sm:contents">
        <span className="min-w-0 break-keep sm:truncate sm:order-1" title={name}>{name}</span>
        <span className="shrink-0 text-right tabular-nums sm:order-3">{value === null ? <span className="text-muted">응답 부족{note ? ` (${note})` : ""}</span> : <strong>{formatScore(value)}점</strong>}</span>
      </div>
      <span className="relative h-3 rounded-full bg-line sm:order-2" role="img" aria-label={value === null ? "응답 부족" : `${formatScore(value)}점`}>
        {value !== null && <span className={`absolute inset-y-0 left-0 rounded-full ${BAR_TONE[scoreLevel(value).key]}`} style={{ width: `${(value / 5) * 100}%` }} />}
        {overall !== null && <span className="absolute -inset-y-1 w-0.5 bg-foreground/60" style={{ left: `${(overall / 5) * 100}%` }} aria-hidden="true" />}
      </span>
    </li>
  );
}

function ReportView({ report }: { report: Report }) {
  const { facts, narrative } = report;
  const s = facts.sentiment;
  const pct = (n: number) => (s.total === 0 ? 0 : Math.round((n / s.total) * 100));
  const level = facts.overallAverage === null ? null : scoreLevel(facts.overallAverage);
  const delta = facts.previous ? Math.round(facts.previous.delta * 10) / 10 : null;
  const kindLabel = facts.breakdownKind === "course" ? "교육별" : "센터별";

  return (
    <article id="report-print" className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 text-base sm:p-8">
      {/* 머리말: 로고 · 부서명 · 작성일 (인쇄하면 맨 위에 나온다) */}
      <div className="flex items-end justify-between gap-3 border-b-2 border-primary pb-3">
        <Image src="/logo.png" alt="재정경제부" width={800} height={253} className="h-9 w-auto" />
        <div className="text-right text-xs leading-5 text-muted">
          <p className="font-medium text-foreground">경제교육정책팀</p>
          <p>작성일 {reportDate.format(new Date(report.createdAt))}</p>
        </div>
      </div>
      <h3 className="text-xl font-bold leading-snug break-keep">{reportTitle(report)}</h3>
      {narrative.headline && <p className="rounded-2xl bg-primary-soft p-4 text-base font-semibold leading-7 text-primary">{narrative.headline}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="응답 인원" value={`${facts.totalResponses}명`} sub={`${facts.participatingCenters}개 센터 참여`} />
        <Tile
          label="종합 만족도"
          value={facts.overallAverage === null ? "산출 불가" : `${formatScore(facts.overallAverage)}점`}
          sub={level ? `5점 만점 · ${facts.grade}` : "응답 부족"}
          tone={level?.key === "bad" ? "text-danger" : level?.key === "warn" ? "text-warning" : level?.key === "great" ? "text-primary" : ""}
        />
        <Tile
          label="직전 회차 대비"
          value={delta === null ? "-" : `${delta > 0 ? "▲ +" : delta < 0 ? "▼ " : ""}${delta.toFixed(1)}`}
          sub={deltaText(report)}
          tone={delta === null ? "" : delta > 0 ? "text-success" : delta < 0 ? "text-danger" : ""}
        />
        <Tile label="긍정 의견 비율" value={s.total === 0 ? "-" : `${pct(s.positive)}%`} sub={`서술 ${s.total}건 · 부정 ${pct(s.negative)}%`} />
      </div>

      <Block title="1. 조사 개요">
        <Bullets
          items={[
            <>대상/기간: {reportPeriod(report)}</>,
            <>서술 의견 감성 분석: 긍정 {pct(s.positive)}% / 부정 {pct(s.negative)}% / 중립 {pct(s.neutral)}% (키워드 기준)</>,
          ]}
        />
      </Block>

      <Block title="2. 주요 분석 결과">
        <SubTitle>문항별 만족도 <span className="text-xs font-normal text-muted">(세로선: 전체 평균)</span></SubTitle>
        <ul className="flex flex-col gap-3">
          {facts.items.map((i) => (
            <ScoreRow key={i.number} name={i.label} value={i.mean} overall={facts.overallAverage} />
          ))}
        </ul>

        <SubTitle>{kindLabel} 평균 <span className="text-xs font-normal text-muted">(세로선: 전체 평균)</span></SubTitle>
        <ul className="flex flex-col gap-3">
          {facts.breakdown.map((b) => (
            <ScoreRow key={b.name} name={b.name} value={b.average} note={`${b.responseCount}건`} overall={facts.overallAverage} />
          ))}
        </ul>

        <SubTitle>가. 우수 성과 영역 (유지)</SubTitle>
        <Bullets items={narrative.keep.map((k) => <><strong>{k.title}</strong>: {k.detail}</>)} />
        <SubTitle>나. 핵심 개선 영역 (우선순위)</SubTitle>
        <ol className="flex flex-col gap-3">
          {narrative.fix.map((k, i) => (
            <li key={i} className="flex flex-col items-start gap-1.5 leading-8 break-keep sm:flex-row sm:gap-2">
              <span className="mt-1 h-fit shrink-0 rounded-md bg-danger-soft px-2 text-xs font-semibold leading-6 text-danger">{i + 1}순위</span>
              <span className="min-w-0"><strong>{k.title}</strong>: {k.detail}</span>
            </li>
          ))}
        </ol>
        <SubTitle>다. {kindLabel} 주요 차이 분석</SubTitle>
        <Bullets items={[<>우수 사례: {narrative.gap.bestCase}</>, <>공통 개선 요구사항: {narrative.gap.commonIssue}</>]} />
      </Block>

      <Block title="3. 정책 시사점 및 추진 계획">
        <Bullets items={[<>추진과제 1 - 본부 차원: {narrative.actions.headquarters}</>, <>추진과제 2 - 센터 차원: {narrative.actions.center}</>]} />
      </Block>

      <Block title="4. 대표 수강생 의견">
        <Bullets
          items={[
            <>긍정: {narrative.voice.positive ? `"${narrative.voice.positive}"` : "해당 의견 없음"}</>,
            <>개선: {narrative.voice.improve ? `"${narrative.voice.improve}"` : "해당 의견 없음"}</>,
          ]}
        />
      </Block>

      <p className="border-t border-line pt-3 text-xs leading-6 text-muted">
        ※ 평균·감성 비율·변화량은 프로그램이 계산한 값이며, 문장은 AI가 작성해 부정확할 수 있으니 결재 전에 검토해 주세요. 개선 영역은 전반적 만족도 문항과의 상관으로 추정한 중요도와 만족도를 함께 보고 정했습니다. 응답 5건 미만은 평균을 내지 않고 분석에서 제외했습니다.
      </p>
    </article>
  );
}

type Option = { id: string; name: string };

export function ReportPanel({ rounds, centers, initialRound, initialCenterId }: { rounds: string[]; centers: Option[]; initialRound: string | null; initialCenterId: string | null }) {
  const [state, formAction, pending] = useActionState(generateReport, initialState);
  const [copied, setCopied] = useState(false);
  // 기본은 가장 최근 회차. 전체 회차를 묶으면 분기가 섞여 의미가 흐려지기 때문이다.
  const [round, setRound] = useState(initialRound ?? rounds[0] ?? "");
  const [center, setCenter] = useState(initialCenterId ?? "");
  const report = state.report;
  const selectClass = "h-10 rounded-xl border border-line bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  async function copy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(reportToText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("아래 내용을 복사해 주세요.", reportToText(report));
    }
  }

  return (
    <Card id="report" aria-label="결과 보고서" className="flex scroll-mt-6 flex-col gap-4 p-4! sm:p-6!">
      <header className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
          <ClipboardIcon width={14} height={14} /> 보고서
        </span>
        <h2 className="text-lg font-semibold">결과 보고서</h2>
      </header>

      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            회차
            <select name="round" value={round} onChange={(e) => setRound(e.target.value)} className={selectClass}>
              {rounds.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="">전체 회차</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            센터
            <select name="center" value={center} onChange={(e) => setCenter(e.target.value)} className={selectClass}>
              <option value="">전체 센터</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="flex gap-2 rounded-xl bg-secondary-soft p-3 text-sm leading-6">
          <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-secondary" />
          <span>보고서를 만들면 수강생이 쓴 서술 의견 원문이 외부 AI 서비스(OpenAI)로 전송됩니다. 전화번호·이메일 형태는 가린 뒤 보냅니다. 응답이 5건 이상인 센터만 분석합니다.</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "보고서 작성 중… (최대 1분)" : report ? "이 조건으로 다시 만들기" : "결과 보고서 만들기"}
          </button>
          {report && (
            <>
              <button type="button" onClick={copy} className="h-10 rounded-xl border border-line px-4 text-sm font-medium transition hover:bg-line/60">
                {copied ? "복사됨" : "글 복사"}
              </button>
              <button type="button" onClick={() => window.print()} className="h-10 rounded-xl border border-line px-4 text-sm font-medium transition hover:bg-line/60">
                인쇄 / PDF 저장
              </button>
            </>
          )}
        </div>
        {state.status === "error" && state.message && (
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        )}
      </form>

      {report && <ReportView report={report} />}
    </Card>
  );
}
