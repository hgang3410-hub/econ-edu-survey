// Design Ref: §3.2 — 담당자 로그인 `/login?role=center|company`. 시작 화면에서 고른 역할로 로그인한다.
// 이미 로그인했다면 대시보드로 보내고, 역할 없이 들어오면 시작 화면으로 보낸다.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Brand, Card } from "@/components/Card";
import { ArrowLeftIcon } from "@/components/icons";
import { LoginForm } from "@/components/LoginForm";
import { CardSkeleton } from "@/components/Skeleton";
import { LOGIN_ROLES, parseLoginRole } from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = {
  title: "담당자 로그인",
  robots: { index: false, follow: false },
};

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const role = parseLoginRole((await searchParams).role);
  if (!role) redirect("/");
  if (await getViewer()) redirect("/dashboard");

  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">{LOGIN_ROLES[role].label}</p>
        <h1 className="text-2xl font-semibold">로그인</h1>
        <p className="text-muted">{LOGIN_ROLES[role].summary}</p>
      </header>
      <LoginForm role={role} />
      <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeftIcon width={16} height={16} /> 다른 역할 선택하기
      </Link>
    </Card>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16">
      <Brand />
      <Suspense fallback={<Card><CardSkeleton /></Card>}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
