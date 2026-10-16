"use client";

// 교육별 AI 요약과 교육 비교 요약. 버튼 하나로 교육마다 요약하고, 교육이 둘 이상이면 비교 요약도 만든다.
// 외부 AI로 서술 원문이 전송된다는 안내는 보내기 전(버튼 옆)에 보여 준다.
import { useActionState } from "react";
import { generateCourseInsights, type CourseInsightState } from "@/app/actions/courses";
import { AlertIcon, SparkIcon } from "@/components/icons";
import type { CompareContent } from "@/lib/ai/compare";
import type { SummaryContent } from "@/lib/ai/summarize";

const initialState: CourseInsightState = { status: "idle" };

export type CourseInsight = {
  courseName: string;
  responseCount: number;
  summary: SummaryContent | null;
  /** 저장된 요약이 현재 응답 수와 같은가 */
  isFresh: boolean;
};

function Bullets({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className={`flex flex-col gap-1.5 border-l-4 pl-4 ${tone}`}>
      <h5 className="text-sm font-semibold">{title}</h5>
      {items.length === 0 ? (
        <p className="text-sm text-muted">정리할 의견이 없습니다.</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 marker:text-muted">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = {
  centerId: string;
  round: string | null;
  courses: CourseInsight[];
  comparison: CompareContent | null;
  comparisonFresh: boolean;
  /** 점수를 비교할 수 있는(응답 5건 이상) 교육 수 */
  comparableCount: number;
};

export function CourseInsightsPanel({ centerId, round, courses, comparison, comparisonFresh, comparableCount }: Props) {
  const [state, formAction, pending] = useActionState(generateCourseInsights, initialState);
  const withResponses = courses.filter((c) => c.responseCount > 0);
  const allFresh = withResponses.every((c) => c.isFresh) && (comparableCount < 2 || comparisonFresh);
  const hasAny = withResponses.some((c) => c.summary) || comparison;
  const failed = state.status === "error";

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="centerId" value={centerId} />
        <input type="hidden" name="round" value={round ?? ""} />
        <p className="flex gap-2 rounded-xl bg-secondary-soft p-3 text-sm leading-6">
          <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-secondary" />
          <span>요약을 만들면 교육별 서술 의견 원문이 외부 AI 서비스(OpenAI)로 전송됩니다. 전화번호·이메일 형태는 가린 뒤 보냅니다.</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || (allFresh && !!hasAny)}
            className="h-10 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "교육별 요약 만드는 중…" : hasAny ? (allFresh ? "최신 요약입니다" : "요약 새로 만들기") : "교육별 요약·비교 만들기"}
          </button>
          {hasAny && !allFresh && <span className="text-sm text-muted">새 응답이 있어 요약을 새로 만들 수 있습니다.</span>}
        </div>
        {failed && state.message && (
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        )}
      </form>

      {!failed && withResponses.some((c) => c.summary) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {withResponses.map((course) => (
            <article key={course.courseName} className="flex flex-col gap-4 rounded-2xl border border-line bg-background p-4">
              <header className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  <SparkIcon width={14} height={14} /> AI 요약
                </span>
                <h4 className="font-semibold">{course.courseName}</h4>
                <span className="text-xs text-muted">응답 {course.responseCount}건</span>
              </header>
              {course.summary ? (
                <>
                  <Bullets title="좋았던 점" items={course.summary.good} tone="border-secondary" />
                  <Bullets title="개선 요청" items={course.summary.improve} tone="border-accent" />
                </>
              ) : (
                <p className="text-sm text-muted">아직 요약이 없습니다. 위 버튼을 눌러 주세요.</p>
              )}
            </article>
          ))}
        </div>
      )}

      {!failed && comparison && (
        <article className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary-soft p-4 sm:p-5">
          <header className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-primary">
              <SparkIcon width={14} height={14} /> 교육 비교 요약
            </span>
            <h4 className="font-semibold">{withResponses.map((c) => c.courseName).join(" · ")}</h4>
          </header>
          <Bullets title="공통점" items={comparison.common} tone="border-primary" />
          <Bullets title="차이점" items={comparison.differences} tone="border-secondary" />
          <Bullets title="시사점" items={comparison.implications} tone="border-accent" />
          <p className="text-xs text-muted">AI가 정리한 내용이라 부정확할 수 있습니다. 중요한 판단은 위 표의 점수와 원문 확인과 함께 해 주세요.</p>
        </article>
      )}
    </div>
  );
}
