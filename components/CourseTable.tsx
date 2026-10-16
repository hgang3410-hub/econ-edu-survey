// 교육별 표: 한 센터의 교육(과정)·회차마다 응답 수, 평균, 문항별 평균을 한 줄씩 보여 준다.
// 평균은 소수점 첫째 자리, 응답이 5건 미만이면 "응답 부족"으로 표시한다.
import { ScoreCards } from "@/components/ScoreCards";
import { BAR_TONE, CELL_TONE } from "@/components/scoreTone";
import type { CourseStat } from "@/lib/data/courses";
import { SCORE_MAX, SCORE_QUESTIONS } from "@/lib/survey/questions";
import { formatScore, scoreLevel } from "@/lib/survey/format";

export function CourseTable({ courses }: { courses: CourseStat[] }) {
  return (
    <div>
      <ScoreCards
        items={courses.map((c) => ({
          key: `${c.courseName}-${c.roundName}`,
          name: c.courseName || `${c.roundName} 교육`,
          sub: c.roundName,
          responseCount: c.responseCount,
          average: c.hasEnough ? c.average : null,
          questionAverages: c.hasEnough ? c.questionAverages : null,
        }))}
      />
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">교육별 평균 점수와 응답 수</caption>
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">교육</th>
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
          {courses.map((course) => (
            <tr key={`${course.courseName}-${course.roundName}`} className="border-t border-line">
              <th scope="row" className="py-3 pr-4 font-medium">
                <span className="block">{course.courseName || `${course.roundName} 교육`}</span>
                <span className="block text-xs font-normal text-muted">{course.roundName}</span>
              </th>
              {course.hasEnough && course.average !== null && course.questionAverages ? (
                <>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-base font-semibold tabular-nums">{formatScore(course.average)}</span>
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-line" aria-hidden="true">
                        <div className={`h-full rounded-full ${BAR_TONE[scoreLevel(course.average).key]}`} style={{ width: `${(course.average / SCORE_MAX) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{course.responseCount}</td>
                  {course.questionAverages.map((value, index) => (
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
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-line/70 px-2.5 py-1 text-xs font-medium text-muted">응답 부족{course.responseCount === 0 ? " (0건)" : ""}</span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{course.responseCount}</td>
                  <td colSpan={SCORE_QUESTIONS.length} className="px-1 py-3 text-center text-xs text-muted">
                    응답 부족
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
