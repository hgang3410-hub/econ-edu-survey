// Design Ref: §3.1·§5 — 설문 링크로 센터·회차·마감 여부를 알아낸다. 수강생은 아무 정보도 입력하지 않는다.
import "server-only";
import { db } from "@/lib/data/client";
import { linkIdSchema } from "@/lib/survey/schema";
import type { Viewer } from "@/lib/data/users";

export type SurveyLinkInfo = {
  linkId: string;
  centerName: string;
  roundName: string;
  /** 교육 이름(프로그램명) */
  courseName: string;
  /** 교육일 (YYYY-MM-DD) */
  educationDate: string;
  closesAt: string;
  isClosed: boolean;
};

type LinkRow = {
  id: string;
  closes_at: string;
  sessions: { round_name: string; course_name: string; education_date: string; centers: { name: string } | null } | null;
};

/** 링크 형식이 올바르고 존재하면 정보를 돌려준다. 아니면 null */
export async function findSurveyLink(linkId: string): Promise<SurveyLinkInfo | null> {
  if (!linkIdSchema.safeParse(linkId).success) return null;
  const { data, error } = await db()
    .from("survey_links")
    .select("id, closes_at, sessions(round_name, course_name, education_date, centers(name))")
    .eq("id", linkId)
    .maybeSingle<LinkRow>();
  if (error) throw error;
  if (!data?.sessions?.centers) return null;
  return {
    linkId: data.id,
    centerName: data.sessions.centers.name,
    roundName: data.sessions.round_name,
    courseName: data.sessions.course_name,
    educationDate: data.sessions.education_date,
    closesAt: data.closes_at,
    isClosed: new Date(data.closes_at).getTime() < Date.now(),
  };
}

export type CenterLink = {
  linkId: string;
  /** 수강생이 시작 화면에 입력하는 숫자 6자리 코드 */
  code: string;
  roundName: string;
  courseName: string;
  closesAt: string;
  isClosed: boolean;
};

/** 센터 담당자가 수강생에게 전달할 자기 센터의 설문 링크 목록. 회사 담당자는 센터가 없어 빈 목록 */
export async function listLinksForViewer(viewer: Viewer): Promise<CenterLink[]> {
  if (viewer.role !== "center" || !viewer.centerId) return [];
  const { data, error } = await db()
    .from("survey_links")
    .select("id, code, closes_at, sessions!inner(round_name, course_name, center_id)")
    .eq("sessions.center_id", viewer.centerId)
    .returns<{ id: string; code: string; closes_at: string; sessions: { round_name: string; course_name: string } }[]>();
  if (error) throw error;
  return data
    .map((row) => ({
      linkId: row.id,
      code: row.code,
      roundName: row.sessions.round_name,
      courseName: row.sessions.course_name,
      closesAt: row.closes_at,
      isClosed: new Date(row.closes_at).getTime() < Date.now(),
    }))
    .sort((a, b) => b.closesAt.localeCompare(a.closesAt));
}

/** 숫자 6자리 코드로 설문 링크 값을 찾는다. 없으면 null, 틀린 입력이 너무 잦으면 "too_many" */
export async function findLinkIdByCode(code: string): Promise<string | null | "too_many"> {
  const { data, error } = await db().rpc("find_link_by_code", { p_code: code });
  if (error) {
    if (error.message.includes("too_many_attempts")) return "too_many";
    throw error;
  }
  return (data as string | null) ?? null;
}
