"use client";

// Design Ref: §3.1 — 수강생 응답 화면. 한 번에 1~2개 질문만 카드로 보여 주는 단계형(타입폼 스타일) 화면이다.
// 화면 검사는 편의용이고, 실제 검사는 서버(app/actions/survey.ts)에서 다시 한다.
import Link from "next/link";
import { startTransition, useActionState, useRef, useState, type FormEvent, type ReactNode } from "react";
import { submitSurvey, type SubmitState } from "@/app/actions/survey";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from "@/components/icons";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_PRIVACY_NOTICE,
  COMMENT_QUESTIONS,
  SCORE_LABELS,
  SCORE_MAX,
  SCORE_MIN,
  SCORE_QUESTIONS,
} from "@/lib/survey/questions";

const SCORES = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => SCORE_MIN + i);
const initialState: SubmitState = { status: "idle" };

type ScoreQuestion = (typeof SCORE_QUESTIONS)[number];
type Step =
  | { kind: "score"; title: string; questions: ScoreQuestion[] }
  | { kind: "comment"; title: string };

// 정량 문항은 2개씩 묶고, 마지막 단계는 서술 의견 2개다.
const STEPS: Step[] = [
  ...Array.from({ length: Math.ceil(SCORE_QUESTIONS.length / 2) }, (_, i): Step => {
    const questions: ScoreQuestion[] = SCORE_QUESTIONS.slice(i * 2, i * 2 + 2);
    return { kind: "score", title: questions[0].section, questions };
  }),
  { kind: "comment", title: "서술 의견 (선택)" },
];

export function SurveyForm({ intro, linkId, centerName, courseName }: { intro: ReactNode; linkId: string; centerName: string; courseName: string }) {
  const [state, formAction, pending] = useActionState(submitSurvey, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({ 9: "", 10: "" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const stepAnswered = step.kind === "score" ? step.questions.every((q) => scores[q.number] !== undefined) : true;
  const overLimit = COMMENT_QUESTIONS.some((q) => [...comments[q.number]].length > COMMENT_MAX_LENGTH);
  const allAnswered = SCORE_QUESTIONS.every((q) => scores[q.number] !== undefined);

  function goTo(index: number) {
    setStepIndex(index);
    // 새 화면의 맨 위(진행 표시줄)가 이미 보이면 그대로 두고, 가려져 있을 때만 그 위치로 가볍게 옮긴다.
    requestAnimationFrame(() => {
      if ((formRef.current?.getBoundingClientRect().top ?? 0) < 0) formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      // 키보드·화면낭독기 사용자를 위해 새 단계의 제목으로 초점을 옮긴다. (화면이 움직이지 않게 한다)
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  // form action을 그대로 쓰면 React가 오류 뒤에 입력값을 모두 지우고, 안 보이는 단계의 값은 폼에 없으므로 직접 만들어 보낸다.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLast || !allAnswered || overLimit) return;
    const formData = new FormData();
    formData.set("linkId", linkId);
    for (const question of SCORE_QUESTIONS) formData.set(`q${question.number}`, String(scores[question.number]));
    for (const question of COMMENT_QUESTIONS) formData.set(`q${question.number}`, comments[question.number]);
    startTransition(() => formAction(formData));
  }

  if (state.status === "success") {
    return (
      <div role="status" className="step-in flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center shadow-card">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircleIcon width={30} height={30} />
        </span>
        <p className="text-xl font-semibold">응답해 주셔서 감사합니다</p>
        <p className="leading-7">
          <strong>{centerName}</strong>의 <strong>{courseName}</strong>에 대한
          <br />
          소중한 의견이 전달되었습니다.
        </p>
        <p className="max-w-sm text-sm leading-6 text-muted">남겨 주신 의견은 AI가 핵심을 파악하여 교육 환경 개선에 반영합니다. 이 창은 닫으셔도 됩니다.</p>
        <Link href="/" className="mt-2 flex h-12 items-center justify-center rounded-2xl bg-primary px-6 font-semibold text-primary-foreground transition hover:opacity-90">
          처음 화면으로
        </Link>
      </div>
    );
  }

  const errorEntries = Object.entries(state.fieldErrors ?? {});

  return (
    <>
    {/* 교육 정보는 첫 화면(1·2번 문항)에서만 보인다. */}
    {stepIndex === 0 && intro}
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 응답하는 동안에만 보이는 안내. 제출을 끝낸 화면에서는 보이지 않는다. */}
      <p className="leading-7 text-muted">약 3분 걸립니다. 이름·연락처는 묻지 않습니다.</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{step.title}</span>
          <span>
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="설문 진행률"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={stepIndex + 1}
          className="h-2 overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div key={stepIndex} className="step-in flex flex-col gap-6 rounded-3xl bg-surface p-6 shadow-card sm:p-9">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          {step.title}
        </h2>

        {step.kind === "score" &&
          step.questions.map((question) => (
            <fieldset key={question.number} className="flex flex-col gap-4">
              <legend className="mb-1 leading-8">
                <span className="mr-2 inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-sm font-semibold text-primary">
                  Q{question.number} · {question.label}
                </span>
                <span className="block pt-2 text-lg font-medium">{question.text}</span>
              </legend>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {SCORES.map((value) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`q${question.number}`}
                      value={value}
                      checked={scores[question.number] === value}
                      onChange={() => setScores((prev) => ({ ...prev, [question.number]: value }))}
                      className="peer sr-only"
                    />
                    <span className="flex h-14 items-center justify-center rounded-2xl border border-line bg-background text-lg font-semibold transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-secondary peer-focus-visible:ring-offset-2 hover:border-primary/60">
                      {value}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>
                  {SCORE_MIN} {SCORE_LABELS.min}
                </span>
                <span>
                  {SCORE_MAX} {SCORE_LABELS.max}
                </span>
              </div>
            </fieldset>
          ))}

        {step.kind === "comment" && (
          <>
            {COMMENT_QUESTIONS.map((question) => {
              const length = [...comments[question.number]].length;
              return (
                <div key={question.number} className="flex flex-col gap-2">
                  <label htmlFor={`q${question.number}`} className="leading-8">
                    <span className="mr-2 inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-semibold text-accent">
                      Q{question.number} · {question.label}
                    </span>
                    <span className="block pt-2 text-lg font-medium">{question.text}</span>
                  </label>
                  <textarea
                    id={`q${question.number}`}
                    rows={4}
                    maxLength={COMMENT_MAX_LENGTH}
                    value={comments[question.number]}
                    onChange={(e) => setComments((prev) => ({ ...prev, [question.number]: e.target.value }))}
                    className="rounded-2xl border border-line bg-background p-4 leading-7 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex justify-between text-sm text-muted">
                    <span>※ {COMMENT_PRIVACY_NOTICE}</span>
                    <span className={length >= COMMENT_MAX_LENGTH ? "text-danger" : ""}>
                      {length}/{COMMENT_MAX_LENGTH}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="rounded-2xl bg-secondary-soft p-4 text-sm leading-6">
              서술 의견은 요약을 위해 외부 AI 서비스(OpenAI)로 전송될 수 있습니다. 전화번호·이메일 형태는 가린 뒤 보냅니다.{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-primary underline underline-offset-4">
                개인정보 처리 안내
              </Link>
            </p>
          </>
        )}

        {state.status === "error" && state.message && (
          <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
            <p className="font-medium">{state.message}</p>
            {errorEntries.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {errorEntries.map(([key, message]) => (
                  <li key={key}>
                    {key.toUpperCase()}: {message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(stepIndex - 1)}
          disabled={stepIndex === 0 || pending}
          className="flex h-12 items-center gap-1.5 rounded-xl px-4 font-medium text-muted transition hover:bg-line/60 disabled:invisible"
        >
          <ArrowLeftIcon width={18} height={18} /> 이전
        </button>

        {isLast ? (
          <button
            key="submit"
            type="submit"
            disabled={!allAnswered || overLimit || pending}
            className="h-12 rounded-2xl bg-primary px-8 font-semibold text-primary-foreground shadow-sm transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "제출 중…" : "제출하기"}
          </button>
        ) : (
          <button
            key="next"
            type="button"
            onClick={(event) => {
              // 같은 자리의 "제출하기" 버튼으로 바뀌는 순간 이 클릭이 제출로 이어지지 않게 막는다.
              event.preventDefault();
              goTo(stepIndex + 1);
            }}
            disabled={!stepAnswered}
            className="flex h-12 items-center gap-1.5 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            다음 <ArrowRightIcon width={18} height={18} />
          </button>
        )}
      </div>
      {!stepAnswered && <p className="text-center text-sm text-muted">이 단계의 문항에 모두 답하면 다음으로 넘어갈 수 있습니다.</p>}
    </form>
    </>
  );
}
