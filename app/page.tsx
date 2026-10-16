import Image from "next/image";
import Link from "next/link";
import { RoleSelector } from "@/components/RoleSelector";
import { ShieldIcon } from "@/components/icons";

// 첫 화면: 파란 히어로 배너 아래에서 이용 대상(수강생 / 센터 담당자 / 정책팀 담당자)을 고른다.

export default function Home() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-10">
      <section className="hero rounded-[2rem] px-6 pb-20 pt-6 sm:px-10 sm:pb-28 sm:pt-8">
        <svg className="hero-wave" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 60 C 150 10, 300 110, 450 60 S 750 10, 900 60 S 1050 110, 1200 60 V120 H0 Z" fill="#ffffff" />
        </svg>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" aria-label="처음 화면으로 돌아가기" className="flex items-center gap-3">
            {/* 재정경제부 로고: 흰 바탕 이미지라서 파란 배경 위에서도 보이도록 흰 상자에 담는다. */}
            <span className="flex items-center rounded-xl bg-white px-2 py-1 shadow-sm">
              <Image src="/logo.png" alt="재정경제부" width={800} height={253} priority className="h-9 w-auto" />
            </span>
            <span className="text-shadow-soft text-sm font-semibold leading-tight sm:text-base">
              경제교육 만족도 조사
              <span className="block text-xs font-normal opacity-90">지역경제교육센터</span>
            </span>
          </Link>
          <Link href="/privacy" className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium hover:bg-white/25 sm:text-sm">
            <ShieldIcon width={14} height={14} /> 개인정보 안내
          </Link>
        </div>

        <header className="mt-10 flex flex-col gap-5 sm:mt-14">
          <span className="glass w-fit rounded-full px-3 py-1 text-xs font-medium sm:text-sm">공공기관 교육 만족도 조사</span>
          <h1 className="text-shadow-soft text-3xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]">
            통합된 설문조사로
            <br />
            <span className="sm:whitespace-nowrap">
              센터별 교육현황을
              <br className="sm:hidden" /> 한눈에 확인합니다
            </span>
          </h1>
          <p className="text-shadow-soft max-w-3xl text-base leading-8 opacity-95 sm:text-lg">
            간단한 5점 평가와 솔직한 피드백을 남겨주세요.
            <br />
            남겨주신 의견은 AI가 핵심을 파악하여
            <br className="sm:hidden" /> 교육 환경 개선에 반영합니다.
          </p>
        </header>
      </section>

      <RoleSelector />

      <p className="flex items-start gap-2.5 rounded-3xl bg-primary-soft p-5 text-sm leading-7 text-primary">
        <ShieldIcon width={18} height={18} className="mt-1 shrink-0" />
        <span>
          수강생에게는 이름·연락처를 묻지 않습니다.
          <br />
          남겨 주신 서술 의견은 개인정보를 가린 뒤
          <br />
          AI 서비스로 전송되어 요약됩니다.{" "}
          <Link href="/privacy" className="font-semibold underline underline-offset-4">
            자세히 보기
          </Link>
        </span>
      </p>
    </main>
  );
}
