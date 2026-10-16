"use client";

// 시작 화면: 수강생 / 지역경제교육센터 담당자 / 경제교육정책팀 담당자 카드 3장.
// 수강생은 로그인 없이, 담당자에게 받은 숫자 6자리 접속 코드로 설문에 들어간다. (코드가 센터와 교육 회차를 정한다)
import Link from "next/link";
import { useActionState, useState } from "react";
import { enterWithCode } from "@/app/actions/code";
import { ArrowRightIcon, ChartIcon, ClipboardIcon, UsersIcon } from "@/components/icons";
import { LOGIN_ROLES } from "@/lib/auth/roles";

const cardClass = "lift flex flex-col gap-4 rounded-3xl bg-surface p-6 shadow-card";
const tagClass = "w-fit rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide";

export function RoleSelector() {
  const [code, setCode] = useState("");
  const [state, formAction, pending] = useActionState(enterWithCode, {});

  return (
    <section aria-label="이용 대상 선택" className="relative z-10 -mt-14 flex flex-col gap-4 sm:-mt-20">
      <h2 className="sr-only">어떤 분이신가요?</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {/* 수강생: 접속 코드를 바로 입력 */}
        <article className={cardClass}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
            <ClipboardIcon />
          </span>
          <div className="flex flex-col gap-1.5">
            <span className={`${tagClass} bg-secondary-soft text-secondary`}>수강생 · 설문 참여</span>
            <h3 className="text-xl font-bold">수강생</h3>
            <p className="text-sm leading-6 text-muted">받은 숫자 6자리 코드로 교육 만족도 설문에 응답합니다.</p>
          </div>
          <form action={formAction} className="mt-auto flex flex-col gap-2">
            <label htmlFor="survey-code" className="sr-only">숫자 6자리 접속 코드</label>
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
              placeholder="코드 6자리 입력"
              className="h-12 rounded-2xl border border-line bg-background px-4 font-mono text-lg tracking-[0.3em] outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
            <button
              type="submit"
              disabled={code.length !== 6 || pending}
              className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-primary font-semibold text-primary-foreground shadow-sm enabled:hover:brightness-110 disabled:opacity-40"
            >
              {pending ? "확인 중…" : "설문 참여하기"} <ArrowRightIcon width={18} height={18} />
            </button>
            {state.message ? (
              <p role="alert" className="text-sm text-danger">{state.message}</p>
            ) : (
              <p className="text-xs text-muted">로그인·이름·연락처가 필요 없습니다.</p>
            )}
          </form>
        </article>

        {/* 센터 담당자 */}
        <article className={cardClass}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <UsersIcon />
          </span>
          <div className="flex flex-col gap-1.5">
            <span className={`${tagClass} bg-primary-soft text-primary`}>센터 · 현황 관리</span>
            <h3 className="text-xl font-bold">{LOGIN_ROLES.center.label}</h3>
            <p className="text-sm leading-6 text-muted">{LOGIN_ROLES.center.summary}</p>
          </div>
          <Link
            href="/login?role=center"
            className="mt-auto flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-foreground font-semibold text-background shadow-sm hover:opacity-90"
          >
            센터 관리자 접속 <ArrowRightIcon width={18} height={18} />
          </Link>
        </article>

        {/* 정책팀 담당자 */}
        <article className={cardClass}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <ChartIcon />
          </span>
          <div className="flex flex-col gap-1.5">
            <span className={`${tagClass} bg-accent-soft text-accent`}>정책팀 · 종합 분석</span>
            <h3 className="text-xl font-bold">{LOGIN_ROLES.company.label}</h3>
            <p className="text-sm leading-6 text-muted">{LOGIN_ROLES.company.summary}</p>
          </div>
          <Link
            href="/login?role=company"
            className="mt-auto flex h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-primary font-semibold text-primary hover:bg-primary-soft"
          >
            정책팀 대시보드 <ArrowRightIcon width={18} height={18} />
          </Link>
        </article>
      </div>
    </section>
  );
}
