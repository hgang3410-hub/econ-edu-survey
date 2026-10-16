// 점수 단계별 색 (표와 교육별 표가 함께 쓴다). 색만으로 뜻을 전하지 않도록 화면에는 단계 안내도 함께 보여 준다.
export const CELL_TONE = {
  great: "bg-success-soft text-success font-semibold",
  ok: "text-foreground",
  warn: "bg-warning-soft text-warning font-semibold",
  bad: "bg-danger-soft text-danger font-semibold",
} as const;

export const BAR_TONE = { great: "bg-success", ok: "bg-secondary", warn: "bg-warning", bad: "bg-danger" } as const;
export const DOT_TONE = { great: "bg-success", ok: "bg-line", warn: "bg-warning", bad: "bg-danger" } as const;
