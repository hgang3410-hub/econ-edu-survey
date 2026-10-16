// 개인정보 처리 안내: 이 서비스가 무엇을 받고, 어디에 쓰고, 누가 보는지를 쉬운 말로 알린다.
// 아래 내용은 실제 프로그램 동작을 그대로 적은 것이다. (정식 개인정보 처리방침 문구는 기관 검토 후 교체)
import type { Metadata } from "next";
import Link from "next/link";
import { Brand, Card } from "@/components/Card";
import { ArrowLeftIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "개인정보 처리 안내",
  description: "경제교육 만족도 조사에서 어떤 정보를 받고 어떻게 쓰는지 안내합니다.",
};

const SECTIONS = [
  {
    title: "받지 않는 정보",
    items: ["이름, 연락처, 소속기관은 묻지 않습니다.", "설문 응답에 접속 주소(IP)나 사용 기기 정보를 함께 저장하지 않습니다.", "로그인이나 회원가입 없이 받은 링크로만 응답합니다."],
  },
  {
    title: "저장하는 정보",
    items: ["5점으로 평가한 8개 문항의 점수", "직접 쓰신 서술 의견 (쓰지 않아도 됩니다)", "제출한 시각, 그리고 어느 센터의 어떤 교육 설문인지 (링크로 정해집니다)"],
  },
  {
    title: "이렇게 사용합니다",
    items: [
      "센터별 교육 만족도를 비교하고 교육 환경을 개선하는 데 사용합니다.",
      "서술 의견은 핵심을 정리하기 위해 외부 AI 서비스(OpenAI)로 전송됩니다. 보내기 전에 전화번호·이메일·주민등록번호 형태는 가리고, 서비스 쪽에 저장하지 않도록 요청합니다.",
      "응답 내용은 경제교육정책팀과 해당 센터 담당자만 볼 수 있고, 다른 수강생에게는 보이지 않습니다.",
    ],
  },
  {
    title: "꼭 알아 두세요",
    items: [
      "서술 의견에 이름·연락처 같은 개인정보는 적지 마세요.",
      "한 번 제출한 응답은 수강생이 직접 수정하거나 삭제할 수 없습니다. 제출 전에 내용을 확인해 주세요.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <Brand />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">개인정보 처리 안내</h1>
        <p className="leading-7 text-muted">경제교육 만족도 조사에서 어떤 정보를 받고, 어디에 쓰고, 누가 보는지 알려 드립니다.</p>
      </header>

      {SECTIONS.map((section) => (
        <Card key={section.title} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <ul className="flex flex-col gap-2 leading-7">
            {section.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeftIcon width={16} height={16} /> 처음 화면으로
      </Link>
    </main>
  );
}
