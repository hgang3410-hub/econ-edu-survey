"use client";

// 시작 화면: 수강생 / 지역경제교육센터 담당자 / 경제교육정책팀 담당자 중 하나를 고르고 해당 화면으로 넘어간다.
// 수강생은 로그인 없이, 담당자에게 받은 숫자 6자리 코드로 설문에 들어간다. (코드가 센터와 교육 회차를 정한다)
import Link from "next/link";
import { useActionState, useState } from "react";
import { enterWithCode } from "@/app/actions/code";
import { ArrowRightIcon, ChartIcon, ClipboardIcon, UsersIcon } from "@/components/icons";
import { LOGIN_ROLES } from "@/lib/auth/roles";

type Choice = "student" | "center" | "company";

const CHOICES = [
  { id: "student", title: "수강생", summary: "받은 숫자 6자리 코드로 교육 만족도 설문에 응답합니다.", icon: ClipboardIcon, tone: "bg-secondary-soft text-secondary" },
  { id: "center", title: LOGIN_ROLES.center.label, summary: LOGIN_ROLES.center.summary, icon: UsersIcon, tone: "bg-primary-soft text-primary" },
  { id: "company", title: LOGIN_ROLES.company.label, summary: LOGIN_ROLES.company.summary, icon: ChartIcon, tone: "bg-accent-soft text-accent" },
] as const;

export function RoleSelector() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [code, setCode] = useState("");
  const [state, formAction, pending] = useActionState(enterWithCode, {});

  return (
    <section aria-label="이용 대상 선택" className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">어떤 분이신가요?</h2>

      <div role="radiogroup" aria-label="이용 대상" className="grid gap-3 sm:grid-cols-3">
        {CHOICES.map((item) => {
          const selected = choice === item.id;
          return (
            <label key={item.id} className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value={item.id}
                checked={selected}
                onChange={() => setChoice(item.id)}
                className="peer sr-only"
              />
              <span className="flex h-full flex-col gap-3 rounded-3xl bg-surface p-6 shadow-card transition peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-secondary hover:border-primary/60">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
                  <item.icon />
                </span>
                <span className="text-lg font-semibold leading-snug">{item.title}</span>
                <span className="text-sm leading-6 text-muted">{item.summary}</span>
              </span>
            </label>
          );
        })}
      </div>

      {choice === "student" && (
        <form action={formAction} className="step-in flex flex-col gap-3 rounded-3xl bg-surface p-6 shadow-card">
          <label htmlFor="survey-code" className="font-medium">
            담당자에게 받은 숫자 6자리 코드를 입력해 주세요
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="survey-code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="예) 123456"
              className="h-12 flex-1 rounded-xl border border-line bg-background px-4 font-mono text-lg tracking-[0.4em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={code.length !== 6 || pending}
              className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-40"
            >
              설문 시작 <ArrowRightIcon width={18} height={18} />
            </button>
          </div>
          {state.message ? (
            <p role="alert" className="text-sm text-danger">
              {state.message}
            </p>
          ) : (
            <p className="text-sm text-muted">로그인은 필요 없고 이름·연락처도 묻지 않습니다.</p>
          )}
        </form>
      )}

      {(choice === "center" || choice === "company") && (
        <div className="step-in flex flex-col gap-3 rounded-3xl bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-7">
            <span className="font-semibold">{LOGIN_ROLES[choice].label}</span>로 로그인합니다.
          </p>
          <Link
            href={`/login?role=${choice}`}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            로그인하러 가기 <ArrowRightIcon width={18} height={18} />
          </Link>
        </div>
      )}
    </section>
  );
}
