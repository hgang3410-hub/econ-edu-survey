// 흰색 카드 패널: 옅은 테두리와 살짝 준 그림자로 데이터 구분감을 준다.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-3xl bg-surface p-6 shadow-card ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function Brand({ className = "", stacked = false }: { className?: string; stacked?: boolean }) {
  return (
    // 로고를 누르면 처음 화면(이용 대상 선택)으로 돌아간다.
    <Link href="/" aria-label="처음 화면으로 돌아가기" className={`flex items-center gap-2.5 ${stacked ? "lg:flex-col lg:items-start lg:gap-2" : ""} ${className}`}>
      {/* 재정경제부 로고: 흰 바탕 이미지라서 어두운 화면에서도 보이도록 흰 상자에 담는다. */}
      <span className="flex shrink-0 items-center rounded-xl bg-white px-2 py-1 ring-1 ring-line">
        <Image src="/logo.png" alt="재정경제부" width={800} height={253} className="h-8 w-auto" />
      </span>
      <span className="whitespace-nowrap text-base font-semibold leading-tight">
        경제교육 만족도 조사
        <span className="block text-xs font-normal text-muted">지역경제교육센터</span>
      </span>
    </Link>
  );
}
