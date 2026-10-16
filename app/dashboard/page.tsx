// Design Ref: §3.3 — 센터별 현황 대시보드 `/dashboard` (로그인 필요).
// 현황 요약 카드 · 센터별 현황 표 · 서술 의견 요약 · (센터 담당자) 내 설문 링크
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Card } from "@/components/Card";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { CourseInsightsPanel, type CourseInsight } from "@/components/CourseInsightsPanel";
import { CourseTable } from "@/components/CourseTable";
import { DashboardShell } from "@/components/DashboardShell";
import { Hint } from "@/components/Hint";
import { AlertIcon, ChartIcon, CheckCircleIcon, LinkIcon, UsersIcon } from "@/components/icons";
import { ReportPanel } from "@/components/ReportPanel";
import { StatsTable } from "@/components/StatsTable";
import { CardSkeleton, DashboardSkeleton } from "@/components/Skeleton";
import { SummaryPanel } from "@/components/SummaryPanel";
import { parseStoredComparison } from "@/lib/ai/compare";
import { parseStoredSummary } from "@/lib/ai/summarize";
import { getViewer } from "@/lib/auth/viewer";
import { listLinksForViewer, type CenterLink } from "@/lib/data/links";
import { getCourseStats } from "@/lib/data/courses";
import { getDashboard } from "@/lib/data/stats";
import { COMPARE_KEY, countCenterResponses, getStoredSummary, listComments, MAX_COMMENTS_FOR_SUMMARY } from "@/lib/data/summaries";
import type { Viewer } from "@/lib/data/users";
import { centerTitle, dashboardTitle, formatScore } from "@/lib/survey/format";
import { MIN_RESPONSES_FOR_STATS } from "@/lib/survey/rules";

export const metadata: Metadata = {
  title: "교육 현황",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium" });

const OVERALL_HINT = `응답이 ${MIN_RESPONSES_FOR_STATS}건 이상인 센터의 모든 응답을 합쳐 계산한 평균입니다. 5점 만점이며, 센터가 3곳 미만이면 다른 센터 점수가 드러날 수 있어 담당자 화면에서는 가립니다.`;
const SHORT_HINT = `응답이 ${MIN_RESPONSES_FOR_STATS}건 미만이면 한두 명의 의견에 평균이 크게 흔들릴 수 있어 점수를 보여 주지 않고 "응답 부족"으로 표시합니다.`;

function dashboardHref(round: string | null, centerId?: string, course?: string | null) {
  const params = new URLSearchParams();
  if (round) params.set("round", round);
  if (course) params.set("course", course);
  if (centerId) params.set("center", centerId);
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

function KpiCard({ icon, tone, label, value, note, hint }: { icon: ReactNode; tone: string; label: string; value: string; note: string; hint?: string }) {
  // 정사각형에 가깝게 세로로 쌓은 작은 카드: 아이콘 → 이름 → 값 → 설명
  return (
    <Card className="lift flex min-h-28 flex-col justify-between gap-1.5 p-3.5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs text-muted sm:text-sm">
          <span className="truncate">{label}</span>
          {hint && <Hint text={hint} />}
        </p>
        <p className="text-2xl font-semibold tabular-nums leading-tight">{value}</p>
        <p className="line-clamp-2 text-xs text-muted">{note}</p>
      </div>
    </Card>
  );
}

async function SummarySection({ viewer, centerId, centerName, round, course }: { viewer: Viewer; centerId: string; centerName: string; round: string | null; course: string | null }) {
  const [responseCount, stored, comments] = await Promise.all([
    countCenterResponses(viewer, centerId, round, course),
    getStoredSummary(viewer, centerId, round, course),
    listComments(viewer, centerId, round, course),
  ]);
  return (
    <SummaryPanel
      centerId={centerId}
      centerName={centerName}
      round={round}
      course={course}
      summary={stored ? parseStoredSummary(stored.content) : null}
      isFresh={stored?.responseCount === responseCount}
      responseCount={responseCount}
      commentCount={comments.length}
      capped={comments.length >= MAX_COMMENTS_FOR_SUMMARY}
    />
  );
}

/** 교육별 분석: 한 센터의 교육(과정)마다 점수를 나란히 보고, AI 요약과 교육 비교 요약을 본다. */
async function CourseSection({ viewer, centerId, centerName, round }: { viewer: Viewer; centerId: string; centerName: string; round: string | null }) {
  const stats = await getCourseStats(viewer, centerId, round);
  if (stats.length === 0) return null;

  // 교육 이름 기준으로 합친 요약 정보 (같은 교육이 여러 회차에 있으면 합산)
  const byCourse = new Map<string, number>();
  for (const row of stats) byCourse.set(row.courseName, (byCourse.get(row.courseName) ?? 0) + row.responseCount);
  const names = [...byCourse.keys()].filter(Boolean);

  const insights: CourseInsight[] = await Promise.all(
    names.map(async (name) => {
      const stored = await getStoredSummary(viewer, centerId, round, name);
      const count = byCourse.get(name) ?? 0;
      return { courseName: name, responseCount: count, summary: stored ? parseStoredSummary(stored.content) : null, isFresh: stored?.responseCount === count };
    }),
  );
  const storedComparison = await getStoredSummary(viewer, centerId, round, COMPARE_KEY);
  const total = insights.reduce((sum, c) => sum + c.responseCount, 0);

  // 점수를 비교할 수 있는(응답이 5건 이상인) 교육·회차 수. AI 교육 비교 요약을 만들 수 있는지 판단하는 데 쓴다.
  const comparableCount = stats.filter((c) => c.hasEnough && c.average !== null).length;

  return (
    <Card id="courses" aria-label="교육별 분석" className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">교육별 분석 · {centerTitle(centerName)}</h2>
        <p className="text-sm text-muted">{round ?? "전체 회차"}</p>
      </div>
      <CourseTable courses={stats} />
      {comparableCount < 2 && (
        <p className="border-t border-line pt-4 text-sm text-muted">비교할 수 있는 교육이 2개 미만입니다. 응답이 {MIN_RESPONSES_FOR_STATS}건 이상인 교육만 비교합니다. (응답 부족)</p>
      )}
      <div className="border-t border-line pt-4">
        <CourseInsightsPanel
          centerId={centerId}
          round={round}
          courses={insights}
          comparison={storedComparison ? parseStoredComparison(storedComparison.content) : null}
          comparisonFresh={storedComparison?.responseCount === total}
          comparableCount={comparableCount}
        />
      </div>
    </Card>
  );
}

function LinkCard({ links }: { links: CenterLink[] }) {
  return (
    <Card id="links" aria-label="내 설문 링크" className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="text-lg font-semibold">내 설문 링크</h2>
      <p className="text-sm text-muted">수강생에게는 접속 코드(숫자 6자리)를 알려 주세요. 시작 화면에서 코드를 입력하면 설문으로 들어갑니다. 교육 1회당 코드 1개이며 마감이 지나면 응답을 받지 않습니다.</p>
      {links.length === 0 ? (
        <p className="text-muted">아직 만들어진 설문 링크가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.linkId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
              <div className="flex flex-col">
                <span className="font-medium">{link.courseName || link.roundName}</span>
                <span className="text-sm">
                  접속 코드 <span className="font-mono font-semibold tracking-widest">{link.code}</span>
                </span>
                <span className="text-sm text-muted">
                  {link.courseName ? `${link.roundName} · ` : ""}마감 {dateFormat.format(new Date(link.closesAt))} ·{" "}
                  <span className={link.isClosed ? "" : "font-medium text-success"}>{link.isClosed ? "마감됨" : "응답 받는 중"}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CopyLinkButton path={`/survey/${link.linkId}`} />
                <Link href={`/survey/${link.linkId}`} className="flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium transition hover:bg-line/60">
                  열어 보기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

async function DashboardContent({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const params = await searchParams;
  const roundParam = typeof params.round === "string" ? params.round : null;
  const centerParam = typeof params.center === "string" ? params.center : null;
  const courseParam = typeof params.course === "string" ? params.course : null;

  const [dashboard, links] = await Promise.all([getDashboard(viewer, roundParam, courseParam), viewer.role === "center" ? listLinksForViewer(viewer) : Promise.resolve([])]);
  const round = dashboard.selectedRound;
  const course = dashboard.selectedCourse;
  const isCompany = viewer.role === "company";
  const statusTitle = dashboardTitle(viewer.role);

  // 요약을 볼 센터: 센터 담당자는 자기 센터, 회사 담당자는 표에서 고른 센터
  const selectedCenter = isCompany
    ? dashboard.centers.find((c) => c.centerId === centerParam)
    : dashboard.centers.find((c) => c.centerId === viewer.centerId);

  // 결과 보고서에서 고를 수 있는 센터 (경제교육정책팀만 씀)
  const reportCenters = dashboard.centers.map((c) => ({ id: c.centerId, name: c.centerName }));

  // 요약 카드 4개
  const totalResponses = dashboard.centers.reduce((sum, c) => sum + c.responseCount, 0);
  const enoughCount = dashboard.centers.filter((c) => c.hasEnough).length;
  const roundNote = [course, round].filter(Boolean).join(" · ") || "전체 회차";
  const overallText = dashboard.overallAverage === null ? "—" : formatScore(dashboard.overallAverage);
  const mine = dashboard.centers[0];
  const kpis = isCompany
    ? [
        { icon: <UsersIcon />, tone: "bg-primary-soft text-primary", label: "총 응답 수", value: String(totalResponses), note: roundNote },
        { icon: <ChartIcon />, tone: "bg-secondary-soft text-secondary", label: "전체 평균 점수", value: overallText, note: `응답 ${MIN_RESPONSES_FOR_STATS}건 이상 센터 기준 · 5점 만점`, hint: OVERALL_HINT },
        { icon: <CheckCircleIcon />, tone: "bg-success-soft text-success", label: "응답 충분한 센터", value: `${enoughCount} / ${dashboard.centers.length}`, note: `${MIN_RESPONSES_FOR_STATS}건 이상` },
        { icon: <AlertIcon />, tone: "bg-danger-soft text-danger", label: "응답 부족 센터", value: String(dashboard.centers.length - enoughCount), note: `${MIN_RESPONSES_FOR_STATS}건 미만`, hint: SHORT_HINT },
      ]
    : [
        { icon: <UsersIcon />, tone: "bg-primary-soft text-primary", label: "내 센터 응답 수", value: String(mine?.responseCount ?? 0), note: roundNote },
        { icon: <ChartIcon />, tone: "bg-secondary-soft text-secondary", label: "내 센터 평균 점수", value: mine?.average != null ? formatScore(mine.average) : "응답 부족", note: "5점 만점" },
        { icon: <CheckCircleIcon />, tone: "bg-accent-soft text-accent", label: "전체 평균 점수", value: overallText, note: `응답 ${MIN_RESPONSES_FOR_STATS}건 이상 센터 기준`, hint: OVERALL_HINT },
        { icon: <LinkIcon />, tone: "bg-success-soft text-success", label: "응답 받는 링크", value: `${links.filter((l) => !l.isClosed).length}개`, note: `전체 링크 ${links.length}개` },
      ];

  return (
    <DashboardShell viewer={viewer}>
      <header className="flex flex-col gap-4">
        <div className="hero rounded-3xl px-6 py-6 sm:px-8 sm:py-7">
          <h1 className="text-shadow-soft text-2xl font-bold sm:text-3xl">{statusTitle}</h1>
          <p className="text-shadow-soft mt-1 opacity-95">
            {isCompany ? "경제교육정책팀 담당자님, 모든 센터의 교육 현황입니다." : `${centerTitle(viewer.centerName ?? "")} 담당자님, 우리 센터의 교육 현황입니다.`}
          </p>
        </div>
        <nav aria-label="교육 회차 선택" className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">교육 회차</span>
          {[null, ...dashboard.rounds].map((name) => {
            const active = name === round;
            return (
              <Link
                key={name ?? "all"}
                href={dashboardHref(name, isCompany ? selectedCenter?.centerId : undefined)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-primary bg-primary font-medium text-primary-foreground" : "border-line bg-surface hover:bg-line/60"}`}
              >
                {name ?? "전체"}
              </Link>
            );
          })}
        </nav>
        {dashboard.courses.length > 0 && (
          <nav aria-label="교육 선택" className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">교육</span>
            {[null, ...dashboard.courses].map((name) => {
              const active = name === course;
              return (
                <Link
                  key={name ?? "all-courses"}
                  href={dashboardHref(null, undefined, name)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-primary bg-primary font-medium text-primary-foreground" : "border-line bg-surface hover:bg-line/60"}`}
                >
                  {name ?? "전체"}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {dashboard.centers.length === 0 ? (
        <Card>
          <p className="text-muted">볼 수 있는 센터가 없습니다. 관리자에게 문의해 주세요.</p>
        </Card>
      ) : (
        <>
          {/* 넓은 화면에서는 요약 카드(왼쪽)와 현황 표(오른쪽)를 한 줄에 놓아 스크롤 없이 한눈에 본다. */}
          <div className="grid gap-4 xl:grid-cols-[21rem_minmax(0,1fr)] xl:items-stretch">
          <section aria-label="현황 요약" className="grid max-w-xl grid-cols-2 gap-3 xl:max-w-none">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </section>

          <Card id="overview" aria-label={`${statusTitle} 표`} className="flex scroll-mt-6 flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{statusTitle}</h2>
              {isCompany && <p className="text-sm text-muted">센터 이름을 누르면 아래에 서술 의견 요약이 나옵니다.</p>}
            </div>
            <StatsTable
              centers={dashboard.centers}
              selectedCenterId={selectedCenter?.centerId ?? null}
              hrefFor={isCompany ? (centerId) => dashboardHref(round, centerId) : undefined}
            />
            <p className="text-xs text-muted">
              점수는 5점 만점, 소수점 첫째 자리까지 표시합니다. 응답이 {MIN_RESPONSES_FOR_STATS}건 미만인 센터는 &ldquo;응답 부족&rdquo;으로 표시합니다.
            </p>
          </Card>

          </div>

          {viewer.role === "center" && <LinkCard links={links} />}

          <p className="flex gap-2 rounded-3xl bg-surface p-5 text-sm leading-6 text-muted shadow-card">
            <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-secondary" />
            <span>서술 의견 요약을 만들면 수강생이 쓴 서술 의견 원문이 외부 AI 서비스(OpenAI)로 전송됩니다. 전화번호·이메일 형태는 가린 뒤 보냅니다.</span>
          </p>

          {isCompany && <ReportPanel key={`${round ?? ""}|${selectedCenter?.centerId ?? ""}`} rounds={dashboard.rounds} centers={reportCenters} initialRound={round} initialCenterId={selectedCenter?.centerId ?? null} />}

          {selectedCenter && (
            <Suspense fallback={<Card><CardSkeleton /></Card>}>
              <CourseSection viewer={viewer} centerId={selectedCenter.centerId} centerName={selectedCenter.centerName} round={round} />
            </Suspense>
          )}

          {selectedCenter ? (
            <Suspense fallback={<Card><CardSkeleton /></Card>}>
              <SummarySection viewer={viewer} centerId={selectedCenter.centerId} centerName={selectedCenter.centerName} round={round} course={course} />
            </Suspense>
          ) : (
            <p id="summary" className="scroll-mt-6 text-sm text-muted">
              표에서 센터 이름을 누르면 그 센터의 서술 의견 요약을 볼 수 있습니다.
            </p>
          )}
        </>
      )}
    </DashboardShell>
  );
}

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={props.searchParams} />
    </Suspense>
  );
}
