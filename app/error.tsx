"use client";

// Design Ref: §7 — 오류가 나도 영어 기본 화면 대신 쉬운 한국어 안내만 보여 준다. (자세한 원인은 서버 기록에만 남는다)
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center">
      <h1 className="text-2xl font-semibold">문제가 생겼습니다</h1>
      <p className="leading-7 text-muted">잠시 후 다시 시도해 주세요. 계속되면 교육 담당자에게 알려 주세요.</p>
      <button
        type="button"
        onClick={reset}
        className="h-11 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground transition hover:opacity-90"
      >
        다시 시도
      </button>
    </main>
  );
}
