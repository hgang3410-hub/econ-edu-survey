// Design Ref: §3.3 — 담당자 화면 공통 틀: 왼쪽 메뉴(넓은 화면) / 위쪽 막대(좁은 화면) + 본문.
import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import { Brand } from "@/components/Card";
import { ArrowLeftIcon, ClipboardIcon, LinkIcon, LogoutIcon, SparkIcon, UsersIcon } from "@/components/icons";
import type { Viewer } from "@/lib/data/users";
import { centerTitle, dashboardTitle } from "@/lib/survey/format";

export function DashboardShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  const roleLabel = viewer.role === "company" ? "경제교육정책팀 담당자" : `${centerTitle(viewer.centerName ?? "")} 담당자`.trim();
  const nav = [
    { href: "#overview", label: dashboardTitle(viewer.role), icon: UsersIcon },
    ...(viewer.role === "center" ? [{ href: "#courses", label: "교육별 분석", icon: ClipboardIcon }] : []),
    ...(viewer.role === "company" ? [{ href: "#report", label: "결과 보고서", icon: ClipboardIcon }] : []),
    { href: "#summary", label: "서술 의견 요약", icon: SparkIcon },
    ...(viewer.role === "center" ? [{ href: "#links", label: "내 설문 링크", icon: LinkIcon }] : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:items-stretch lg:justify-start lg:gap-8 lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
        <div className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:gap-4">
          {/* 처음 화면(이용 대상 선택)으로 돌아간다. 다른 역할로 다시 들어갈 수 있도록 로그아웃도 함께 한다. */}
          <form action={logout}>
            <button
              type="submit"
              aria-label="처음 화면으로 돌아가기 (로그아웃)"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm font-medium transition hover:bg-line/60"
            >
              <ArrowLeftIcon width={18} height={18} />
              <span className="hidden sm:inline">처음으로</span>
            </button>
          </form>
          <Brand stacked className="lg:px-2" />
        </div>

        <nav aria-label="화면 메뉴" className="hidden lg:block">
          <ul className="flex flex-col gap-1">
            {nav.map((item, index) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={index === 0 ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    index === 0 ? "bg-primary text-primary-foreground" : "text-muted hover:bg-line/60 hover:text-foreground"
                  }`}
                >
                  <item.icon width={18} height={18} />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3 lg:mt-auto lg:rounded-2xl lg:border lg:border-line lg:bg-background lg:p-3">
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary lg:flex">
            {(viewer.centerName ?? "회")[0]}
          </span>
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-medium">{viewer.username}</p>
            <p className="truncate text-xs text-muted">{roleLabel}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="로그아웃"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium transition hover:bg-line/60 lg:border-0 lg:px-2"
            >
              <LogoutIcon width={18} height={18} />
              <span className="lg:sr-only">로그아웃</span>
            </button>
          </form>
        </div>
      </aside>

      <main id="main-content" className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
        {children}
      </main>
    </div>
  );
}
