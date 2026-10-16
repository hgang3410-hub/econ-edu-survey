"use client";

// Design Ref: §3.3 ② — 센터 간 점수 비교 막대 차트. (응답 5건 미만 센터는 서버에서 이미 빠진 상태로 받는다)
import { formatScore } from "@/lib/survey/format";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

export type ChartPoint = { name: string; value: number; kind: "center" | "mine" | "overall" };

// 밝은/어두운 화면 모두에서 보이도록 화면 색 변수를 따른다.
const COLORS = { center: "var(--primary)", mine: "var(--secondary)", overall: "var(--muted)" } as const;

export function ComparisonChart({ points }: { points: ChartPoint[] }) {
  return (
    <div role="img" aria-label={`센터별 평균 점수: ${points.map((p) => `${p.name} ${formatScore(p.value)}점`).join(", ")}`} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={points} margin={{ top: 20, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b855" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted)" }} interval={0} />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12, fill: "var(--muted)" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {points.map((p) => (
              <Cell key={p.name} style={{ fill: COLORS[p.kind] }} />
            ))}
            <LabelList dataKey="value" position="top" formatter={(v) => formatScore(Number(v))} fontSize={12} style={{ fill: "var(--foreground)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
