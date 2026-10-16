// Design Ref: §3.1 — 수강생 응답 화면 `/survey/[링크 ID]` (로그인 없음).
// 링크가 센터와 회차를 알려 주므로 수강생은 아무 정보도 입력하지 않는다.
import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand } from "@/components/Card";
import { SurveySkeleton } from "@/components/Skeleton";
import { SurveyForm } from "@/components/SurveyForm";
import { findSurveyLink } from "@/lib/data/links";
import { centerTitle } from "@/lib/survey/format";

export const metadata: Metadata = {
  title: "경제교육 만족도 조사",
  // 설문 링크는 검색엔진에 나타나지 않게 한다.
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long" });

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="rounded-3xl bg-surface p-10 text-center shadow-card">
      <p className="text-xl font-semibold">{title}</p>
      <p className="mt-2 leading-7 text-muted">{body}</p>
    </div>
  );
}

async function SurveyContent({ params }: { params: PageProps<"/survey/[linkId]">["params"] }) {
  const { linkId } = await params;
  const link = await findSurveyLink(linkId);

  if (!link) return <Message title="유효하지 않은 링크입니다" body="교육 담당자에게 받은 링크를 다시 확인해 주세요." />;
  if (link.isClosed) return <Message title="마감된 설문입니다" body="응답 기간이 지나 더 이상 응답을 받지 않습니다." />;

  // 교육 정보는 첫 화면(1·2번 문항)에서만 보여 준다. 다음 문항부터는 숨겨 화면 이동을 줄인다.
  // 어떤 센터의 어떤 교육에 대한 설문인지 먼저 알려 준다. (링크가 센터와 교육 회차를 정한다)
  const intro = (
    <section aria-label="응답 대상 교육" className="rounded-2xl border border-primary/20 bg-primary-soft p-4 sm:p-5">
            <p className="text-sm font-medium text-primary">이 설문은 아래 교육에 대한 만족도 조사입니다</p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">교육받은 센터</dt>
                <dd className="font-semibold">{centerTitle(link.centerName)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">교육</dt>
                <dd className="font-semibold">{link.courseName || `${link.roundName} 교육`}</dd>
                {link.courseName && <dd className="text-xs text-muted">{link.roundName}</dd>}
              </div>
              <div>
                <dt className="text-xs text-muted">교육일</dt>
                <dd className="font-semibold">{dateFormat.format(new Date(`${link.educationDate}T00:00:00+09:00`))}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">응답 마감: {dateFormat.format(new Date(link.closesAt))}</p>
    </section>
  );

  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">경제교육 만족도 조사</h1>
      </header>

      <SurveyForm intro={intro} linkId={link.linkId} centerName={centerTitle(link.centerName)} courseName={link.courseName || `${link.roundName} 교육`} />
    </>
  );
}

export default function SurveyPage(props: PageProps<"/survey/[linkId]">) {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <Brand />
      <Suspense fallback={<SurveySkeleton />}>
        <SurveyContent params={props.params} />
      </Suspense>
    </main>
  );
}
