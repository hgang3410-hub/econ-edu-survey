import Image from "next/image";
import Link from "next/link";
import { RoleSelector } from "@/components/RoleSelector";

// 첫 화면: 이용 대상(수강생 / 센터 담당자 / 정책팀 담당자)을 고르면 해당 화면으로 넘어간다.

export default function Home() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-5 py-12 sm:py-20">
      <Link href="/" aria-label="처음 화면으로 돌아가기" className="flex items-center gap-4 self-start">
        {/* 재정경제부 로고: 흰 바탕 이미지라서 어두운 화면에서도 보이도록 흰 상자에 담는다. */}
        <span className="flex items-center rounded-xl bg-white px-2 py-1 ring-1 ring-line">
          <Image src="/logo.png" alt="재정경제부" width={800} height={253} priority className="h-10 w-auto" />
        </span>
        <span className="text-base font-semibold leading-tight">
          경제교육 만족도 조사
          <span className="block text-xs font-normal text-muted">지역경제교육센터</span>
        </span>
      </Link>

      <header className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]">
          통합된 설문조사로
          <br />
          <span className="sm:whitespace-nowrap">센터별 교육현황을 한눈에 확인합니다</span>
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted">
          간단한 5점 평가와 솔직한 피드백을 남겨주세요.
          <br />
          남겨주신 의견은 AI가 핵심을 파악하여 교육 환경 개선에 반영합니다.
        </p>
      </header>

      <RoleSelector />

      <footer className="border-t border-line pt-4 text-sm text-muted">
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          개인정보 처리 안내
        </Link>
      </footer>
    </main>
  );
}
