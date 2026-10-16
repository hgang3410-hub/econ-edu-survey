// 휴대폰용 점수 카드: 표를 옆으로 밀지 않아도 되도록, 센터(또는 교육)마다 카드 하나에 평균과 문항별 점수를 세로로 보여 준다.
// 넓은 화면에서는 표(StatsTable·CourseTable)가 대신 보인다.
import Link from "next/link";
import { BAR_TONE, CELL_TONE } from "@/components/scoreTone";
import { formatScore, scoreLevel } from "@/lib/survey/format";
import { SCORE_MAX, SCORE_QUESTIONS } from "@/lib/survey/questions";

export type ScoreCardItem = {
  key: string;
  name: string;
  /** 이름 아래 작은 글씨 (예: 회차) */
  sub?: string;
  /** 있으면 카드를 눌러 이동한다 */
  href?: string;
  selected?: boolean;
  responseCount: number;
  average: number | null;
  /** 문항 1~8번 평균. 응답 부족이면 null */
  questionAverages: number[] | null;
};

export function ScoreCards({ items }: { items: ScoreCardItem[] }) {
  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {items.map((item) => {
        const enough = item.average !== null && item.questionAverages !== null;
        return (
          <li key={item.key} className={`relative flex flex-col gap-3 rounded-2xl border p-4 ${item.selected ? "border-primary bg-primary-soft" : "border-line"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {item.href ? (
                  <Link href={item.href} aria-current={item.selected ? "true" : undefined} className="font-semibold after:absolute after:inset-0">
                    {item.name}
                  </Link>
                ) : (
                  <p className="font-semibold">{item.name}</p>
                )}
                {item.sub && <p className="text-xs text-muted">{item.sub}</p>}
              </div>
              <p className="shrink-0 text-xs text-muted">응답 {item.responseCount}건</p>
            </div>

            {enough ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold tabular-nums">{formatScore(item.average as number)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                    <div className={`h-full rounded-full ${BAR_TONE[scoreLevel(item.average as number).key]}`} style={{ width: `${((item.average as number) / SCORE_MAX) * 100}%` }} />
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  {SCORE_QUESTIONS.map((q, index) => {
                    const value = (item.questionAverages as number[])[index];
                    return (
                      <div key={q.number} className="flex items-center justify-between gap-2">
                        <dt className="min-w-0 text-muted">{q.label}</dt>
                        <dd className={`shrink-0 rounded-md px-1.5 py-0.5 tabular-nums ${CELL_TONE[scoreLevel(value).key]}`}>{formatScore(value)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </>
            ) : (
              <p className="rounded-xl bg-line/60 px-3 py-2 text-sm text-muted">응답 부족{item.responseCount === 0 ? " (0건)" : ""} — 평균을 표시하지 않습니다.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
