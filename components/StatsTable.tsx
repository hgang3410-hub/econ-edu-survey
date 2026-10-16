// Design Ref: §3.3 ① — 센터별 현황 표. 평균은 소수점 첫째 자리, 응답이 5건 미만이면 평균·문항별 평균 모두 "응답 부족".
import Link from "next/link";
import { SCORE_MAX, SCORE_QUESTIONS } from "@/lib/survey/questions";
import { BAR_TONE, CELL_TONE, DOT_TONE } from "@/components/scoreTone";
import { formatScore, SCORE_LEVELS, scoreLevel } from "@/lib/survey/format";
import { ScoreCards } from "@/components/ScoreCards";
import type { CenterStat } from "@/lib/data/stats";

type Props = {
  centers: CenterStat[];
  /** 센터 행을 누르면 이동할 주소를 만든다. 회사 담당자만 쓴다. (센터 담당자는 값이 없음) */
  hrefFor?: (centerId: string) => string;
  selectedCenterId: string | null;
};

export function StatsTable({ centers, hrefFor, selectedCenterId }: Props) {
  return (
    <div>
      <ScoreCards
        items={centers.map((c) => ({
          key: c.centerId,
          name: c.centerName,
          href: hrefFor?.(c.centerId),
          selected: c.centerId === selectedCenterId,
          responseCount: c.responseCount,
          average: c.hasEnough ? c.average : null,
          questionAverages: c.hasEnough ? c.questionAverages : null,
        }))}
      />
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">센터별 평균 점수와 응답 수</caption>
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">센터</th>
            <th scope="col" className="py-2 pr-4 font-medium">평균 점수</th>
            <th scope="col" className="py-2 pr-4 font-medium">응답 수</th>
            {SCORE_QUESTIONS.map((q) => (
              <th key={q.number} scope="col" className="w-16 px-1 py-2 text-center align-bottom font-medium leading-tight break-keep">
                {q.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {centers.map((center) => {
            const selected = center.centerId === selectedCenterId;
            return (
              <tr
                key={center.centerId}
                className={`relative border-t border-line ${selected ? "bg-primary-soft" : hrefFor ? "hover:bg-background" : ""}`}
              >
                <th scope="row" className="py-2.5 pr-3 font-medium">
                  {hrefFor ? (
                    <Link
                      href={hrefFor(center.centerId)}
                      aria-current={selected ? "true" : undefined}
                      className="underline-offset-4 after:absolute after:inset-0 hover:underline"
                    >
                      {center.centerName}
                    </Link>
                  ) : (
                    center.centerName
                  )}
                </th>
                {center.hasEnough && center.average !== null && center.questionAverages ? (
                  <>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 text-base font-semibold tabular-nums">{formatScore(center.average)}</span>
                        <div className="h-2 w-14 overflow-hidden rounded-full bg-line" aria-hidden="true">
                          <div className={`h-full rounded-full ${BAR_TONE[scoreLevel(center.average).key]}`} style={{ width: `${(center.average / SCORE_MAX) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{center.responseCount}</td>
                    {center.questionAverages.map((value, index) => (
                      <td
                        key={index}
                        title={`${scoreLevel(value).label} (${scoreLevel(value).range})`}
                        className={`px-1 py-3 text-center tabular-nums ${CELL_TONE[scoreLevel(value).key]}`}
                      >
                        {formatScore(value)}
                      </td>
                    ))}
                  </>
                ) : (
                  <>
                    <td className="py-2.5 pr-3 font-medium text-muted">
                      <span className="rounded-full bg-line/70 px-2.5 py-1 text-xs">
                        응답 부족{center.responseCount === 0 ? " (0건)" : ""}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{center.responseCount}</td>
                    <td colSpan={SCORE_QUESTIONS.length} className="px-1 py-3 text-center text-xs text-muted">
                      응답 부족
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <ul aria-label="점수 단계 안내" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {SCORE_LEVELS.map((level) => (
          <li key={level.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${DOT_TONE[level.key]}`} aria-hidden="true" />
            {level.label} {level.range}
          </li>
        ))}
      </ul>
    </div>
  );
}
