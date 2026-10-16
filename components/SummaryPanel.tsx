"use client";

// Design Ref: §3.3 ③·§4.4 — 서술 의견 요약. 외부 AI로 전송된다는 안내는 보내기 전(버튼 옆)에 보여 준다.
import { useActionState } from "react";
import { generateSummary, type SummaryState } from "@/app/actions/summary";
import { Card } from "@/components/Card";
import { AlertIcon, SparkIcon } from "@/components/icons";
import type { SummaryContent } from "@/lib/ai/summarize";

const initialState: SummaryState = { status: "idle" };

type Props = {
  centerId: string;
  centerName: string;
  round: string | null;
  /** 선택한 교육 이름 (전체이면 null) */
  course: string | null;
  summary: SummaryContent | null;
  /** 저장된 요약이 현재 응답 수와 같은가 */
  isFresh: boolean;
  responseCount: number;
  /** 서술 의견이 하나라도 있는 응답 수 (최대 조회 건수까지만 센다) */
  commentCount: number;
  /** 서술 의견이 너무 많아 최근 건수까지만 요약하는가 */
  capped: boolean;
};

function Block({ title, tone, items }: { title: string; tone: "good" | "improve"; items: string[] }) {
  return (
    <div className={`flex flex-col gap-2 border-l-4 pl-4 ${tone === "good" ? "border-secondary" : "border-accent"}`}>
      <h4 className="text-base font-semibold">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted">정리할 의견이 없습니다.</p>
      ) : (
        <ul className="list-disc space-y-1.5 pl-5 leading-7 marker:text-muted">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SummaryPanel({ centerId, centerName, round, course, summary, isFresh, responseCount, commentCount, capped }: Props) {
  const [state, formAction, pending] = useActionState(generateSummary, initialState);

  return (
    <Card id="summary" aria-label="서술 의견 요약" className="flex scroll-mt-6 flex-col gap-5">
      <header className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
          <SparkIcon width={14} height={14} /> AI 요약
        </span>
        <h3 className="text-lg font-semibold">
          {[centerName, course, round ?? (course ? null : "전체 회차")].filter(Boolean).join(" · ")}
        </h3>
      </header>

      {responseCount === 0 ? (
        <p className="text-muted">응답 부족 (0건) — 아직 서술 의견이 없습니다.</p>
      ) : commentCount === 0 ? (
        <p className="text-muted">서술 의견이 아직 없습니다.</p>
      ) : (
        <>
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="centerId" value={centerId} />
            <input type="hidden" name="round" value={round ?? ""} />
            <input type="hidden" name="course" value={course ?? ""} />
            <p className="flex gap-2 rounded-xl bg-secondary-soft p-3 text-sm leading-6">
              <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-secondary" />
              <span>요약을 만들면 이 센터의 서술 의견 원문이 외부 AI 서비스(OpenAI)로 전송됩니다. 전화번호·이메일 형태는 가린 뒤 보냅니다.</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={pending || isFresh}
                className="h-10 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-40"
              >
                {pending ? "요약 만드는 중…" : summary ? (isFresh ? "최신 요약입니다" : "요약 새로 만들기") : "요약 만들기"}
              </button>
              {summary && !isFresh && <span className="text-sm text-muted">새 응답이 있어 요약을 새로 만들 수 있습니다.</span>}
            </div>
            {state.status === "error" && state.message && (
              <p role="alert" className="text-sm text-danger">
                {state.message}
              </p>
            )}
          </form>

          {summary && state.status !== "error" && (
            <article className="flex max-w-3xl flex-col gap-6 border-t border-line pt-5">
              <Block title="좋았던 점" tone="good" items={summary.good} />
              <Block title="개선 요청" tone="improve" items={summary.improve} />
              <p className="text-xs text-muted">AI가 정리한 내용이라 부정확할 수 있습니다. 중요한 판단은 원문 확인과 함께 해 주세요.</p>
              {capped && <p className="text-xs text-muted">서술 의견이 많아 최근 {commentCount}건을 기준으로 요약했습니다.</p>}
            </article>
          )}
        </>
      )}
    </Card>
  );
}
