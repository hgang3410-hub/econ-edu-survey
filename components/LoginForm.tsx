"use client";

// Design Ref: §3.2 — 담당자 로그인. 실패하면 아이디·비밀번호 중 어느 쪽이 틀렸는지 알려 주지 않는다.
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import type { LoginRole } from "@/lib/auth/roles";

const initialState: LoginState = {};

export function LoginForm({ role }: { role: LoginRole }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const passwordRef = useRef<HTMLInputElement>(null);

  // 실패하면 비밀번호만 비우고 아이디는 그대로 둔다. (form action을 그대로 쓰면 아이디까지 지워진다)
  useEffect(() => {
    if (state.message && passwordRef.current) passwordRef.current.value = "";
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("role", role);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        아이디
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={64}
          className="h-12 rounded-xl border border-line bg-background px-3 text-base font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        비밀번호
        <input
          ref={passwordRef}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className="h-12 rounded-xl border border-line bg-background px-3 text-base font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
      {state.message && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-2xl bg-primary font-semibold text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>
      <p className="text-center text-sm text-muted">회원가입은 없습니다. 미리 만들어 둔 계정으로 로그인하세요.</p>
    </form>
  );
}
