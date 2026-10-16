"use server";

// 결과 보고서 만들기: 경제교육정책팀 담당자 확인 → 숫자 계산(코드) → 문장 작성(AI) → 화면에 표시. 저장하지 않는다.
import { writeReportNarrative } from "@/lib/ai/report";
import { getViewer } from "@/lib/auth/viewer";
import { buildReportInput } from "@/lib/data/report";
import { listRounds } from "@/lib/data/stats";
import { listCenters } from "@/lib/data/report";
import type { Report } from "@/lib/report/types";

export type ReportState = { status: "idle" | "error"; message?: string; report?: Report };

export async function generateReport(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "company") return { status: "error", message: "경제교육정책팀 담당자만 보고서를 만들 수 있습니다." };

  const roundValue = formData.get("round");
  const rounds = await listRounds(viewer);
  const round = typeof roundValue === "string" && rounds.includes(roundValue) ? roundValue : null;

  // 센터는 실제로 있는 센터만 받아들인다. (없는 값이면 전체 센터)
  const centerValue = formData.get("center");
  const centers = await listCenters(viewer);
  const centerId = typeof centerValue === "string" && centers.some((c) => c.id === centerValue) ? centerValue : null;

  try {
    const input = await buildReportInput(viewer, round, centerId);
    if (input.facts.totalResponses === 0 || input.facts.qualifiedCenters === 0) {
      return { status: "error", message: "선택한 범위에 응답이 5건 이상인 센터가 없어 보고서를 만들 수 없습니다. (응답 부족) 회차나 센터를 바꿔 보세요." };
    }
    const narrative = await writeReportNarrative(input.facts, input.comments);
    return { status: "idle", report: { facts: input.facts, narrative, createdAt: new Date().toISOString() } };
  } catch (error) {
    // 서술 원문이 남지 않도록 오류 종류만 기록한다.
    console.error("보고서 생성 실패", error instanceof Error ? error.message : "알 수 없는 오류");
    return { status: "error", message: "보고서를 만들지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
