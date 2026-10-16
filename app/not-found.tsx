import Link from "next/link";

// Design Ref: §7 — 없는 주소도 한국어로 안내한다.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center">
      <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <p className="leading-7 text-muted">주소를 다시 확인하거나, 교육 담당자에게 받은 링크로 접속해 주세요.</p>
      <Link href="/" className="flex h-11 items-center rounded-2xl bg-primary px-6 font-semibold text-primary-foreground transition hover:opacity-90">
        처음 화면으로
      </Link>
    </main>
  );
}
