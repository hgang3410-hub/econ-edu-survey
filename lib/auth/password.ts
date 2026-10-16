// Design Ref: §4.2·S3 — 비밀번호는 bcrypt 암호문으로만 비교한다.
// 없는 아이디일 때도 같은 비교를 해서 응답 시간 차이로 아이디 존재 여부를 알 수 없게 한다.
import "server-only";
import bcrypt from "bcryptjs";

/** 존재하지 않는 계정용 미리 만든 암호문 (비용 12) */
const DUMMY_HASH = "$2b$12$7snb6kIVmIHY8LHrN/YtQ.0OpPu6l.oeQmph2UgofgDX2/CFYjT0W";

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  const matched = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return hash !== null && matched;
}
