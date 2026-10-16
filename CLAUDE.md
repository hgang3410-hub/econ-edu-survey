@AGENTS.md

# CLAUDE.md — 지역경제교육 만족도 조사 서비스

> 이 파일은 Claude가 이 프로젝트에서 작업할 때 지켜야 할 규칙서다.
> 기능의 "무엇을/왜"는 [PRD.md](PRD.md)가 기준이며, 이 파일은 "어떻게 만들 것인가"를 정한다.
> PRD와 이 파일이 충돌하면 PRD를 따르고, 충돌 사실을 사용자에게 알린다.

## 0. 필수 작업 규칙 (항상 지킬 것)

### 언어·범위
- 모든 설명과 주석은 **한국어**로 작성한다.
- 새 파일은 **my-app 폴더 안에만** 만든다.
- 기술 스택은 PRD에 정한 대로 **Next.js로 고정**한다. 다른 프레임워크로 바꾸거나 마이그레이션을 제안하지 않는다. 배포는 **Vercel**을 사용한다.
- 코드를 바꾸면 **무엇을 왜 바꿨는지 한 줄로** 알려준다.
- 이미 설치된 서브에이전트는 필요할 때마다 적극 활용한다.

### 비밀 정보·인증
- `.env` 등 비밀 정보 파일과 `node_modules` 폴더는 `.gitignore`에 등록해 두고, **절대 커밋하지 않는다**.
- 외부 서비스 인증이 필요하면 토큰 값을 사용자에게 묻거나 채팅에 출력하지 않고, **`.env`에 있는 값을 읽어서 사용**한다.
  - Supabase를 쓸 상황이 생기면 Supabase CLI를 설치해 `.env`의 `SUPABASE_ACCESS_TOKEN`으로 작업한다.
  - Vercel 작업(배포 등)이 필요하면 Vercel CLI를 설치해 `.env`의 `VERCEL_TOKEN`으로 인증해 작업한다.

### 파일 삭제
- 파일을 지워야 할 때는 바로 삭제하지 않고, `trash-can` 폴더를 만들어 **그 안으로 옮기기만** 한다. 작업이 끝난 뒤 사용자가 직접 확인하고 삭제한다.
- `trash-can` 폴더도 Git에 올라가지 않도록 `.gitignore`에 등록한다.

### 커밋
- 커밋 메시지는 **한국어로, 무엇을 왜 바꿨는지 한 줄**로 적는다.
- 커밋하기 전에 `git status`와 `git diff --cached --name-only`로 `.env` 같은 비밀 값 파일이 커밋에 들어가지 않았는지 **반드시 확인**한다.

## 1. 프로젝트 한 줄 요약

지역경제교육센터 수강생이 링크로 만족도 조사(정량 8 + 정성 2 = 10문항)에 응답하고,
센터·회사 담당자가 센터별 현황을 대시보드로 비교하는 웹 서비스(프로토타입).

- 사용자: 수강생(로그인 없음) / 센터 조사 담당자(자기 센터만) / 회사 담당자(전체 센터)
- must 기능 2개: ① 수강생 만족도 응답 ② 센터별 현황 대시보드 — 이 둘이 끝나기 전에는 nice 기능을 만들지 않는다.

## 2. 기술 스택 (현재 설치된 버전)

| 항목 | 버전/설정 |
|---|---|
| Next.js | **16.4.0** (App Router, `app/` 디렉터리) |
| React | 19.3.0 |
| TypeScript | 5, `strict: true`, 경로 별칭 `@/*` → 프로젝트 루트 |
| 스타일 | Tailwind CSS v4 (`@import "tailwindcss"`, `@theme inline`), Turbopack 로더 `@tailwindcss/turbopack` |
| 린트 | ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript) |
| 폰트 | `next/font/google` Geist / Geist Mono |
| 배포 | Vercel (예정) |
| 데이터 저장 | **Supabase** (확정, 서버 전용 비공개 키·RLS — DESIGN §2.4). 마이그레이션은 `supabase/migrations/` |

## 3. 명령어

```bash
npm run dev     # 개발 서버 (http://localhost:3000)
npm run build   # 프로덕션 빌드 — 작업 완료 전 반드시 통과 확인
npm run lint    # ESLint
```

- 테스트 프레임워크는 아직 없다. 추가가 필요하면 먼저 사용자에게 제안한다.
- 패키지 매니저는 **npm** (`package-lock.json` 사용). 새 의존성은 이유를 설명하고 승인받은 뒤 설치한다.

## 4. Next.js 16 주의사항 (학습 데이터와 다름)

코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 문서를 먼저 읽는다. 특히:

- **Cache Components 사용 중** (`next.config.ts`의 `cacheComponents: true`, `partialPrefetching: true`).
  - 캐싱은 `'use cache'` 지시어 + `cacheLife()`로 한다. 예전 방식(`export const revalidate`, `fetch` 캐시 옵션, `unstable_cache`)을 쓰지 않는다.
  - 응답 데이터처럼 자주 바뀌는 값은 캐시하지 않거나, 저장 후 `revalidateTag`/`updateTag` 등으로 갱신한다 (`docs/01-app/01-getting-started/08-caching.md`, `09-revalidating.md` 참고).
- **Middleware → Proxy**: 요청 전처리는 루트의 `proxy.ts`에 둔다(`middleware.ts` 아님). Proxy는 낙관적 리다이렉트 용도로만 쓰고, 실제 권한 검사는 서버 코드(데이터 접근 계층)에서 다시 한다.
- `params`, `searchParams`는 **Promise**다 → `const { id } = await params`.
- 페이지/레이아웃 props 타입은 전역 헬퍼 `PageProps<'/경로'>`, `LayoutProps<'/경로'>`를 쓴다 (예: `app/layout.tsx`).
- 기본은 Server Component. 상호작용이 필요한 최소 단위에만 `'use client'`를 붙인다.
- 폼 제출은 Server Action(`'use server'`) 또는 Route Handler(`app/api/.../route.ts`)로 처리한다.

## 5. 폴더 구조 (권장안)

아직 `app/layout.tsx`, `app/page.tsx`만 있는 초기 상태다. 새 코드는 아래 구조를 따른다.

```
app/
  survey/[linkId]/page.tsx     # 수강생 응답 화면 (로그인 없음)
  login/page.tsx               # 담당자 로그인
  dashboard/page.tsx           # 센터별 현황 (권한에 따라 범위 다름)
  api/...                      # 필요한 경우에만 Route Handler
lib/
  survey/questions.ts          # 공통 설문 10문항 — 단일 출처(Single Source of Truth)
  data/                        # 저장소 접근 (저장 방식 결정 후 구현)
  auth/                        # 세션·권한 확인
  ai/                          # 서술 의견 요약
components/                    # 재사용 UI 컴포넌트
```

- 파일명: 컴포넌트는 `PascalCase.tsx`, 그 외는 `kebab-case.ts` 또는 `camelCase.ts` 중 하나로 통일한다.
- import는 상대경로 대신 `@/lib/...`, `@/components/...` 별칭을 쓴다.

## 6. 도메인 규칙 (반드시 지킬 것)

PRD 5장 "AI가 지킬 규칙"을 코드 규칙으로 옮긴 것이다. 화면 검증만으로 끝내지 말고 **서버에서도 동일하게 검증**한다.

### 설문 응답 (must 1)
- 문항은 `lib/survey/questions.ts` 한 곳에서만 정의한다. 모든 센터가 같은 문항을 쓰며, 센터별로 문항을 바꾸는 기능은 만들지 않는다.
- 정량 1~8번: 5점 리커트 척도, **정수 1~5만 허용**.
- 정성 9~10번: 문항당 **최대 500자**. 입력란에 "개인정보는 적지 마세요" 안내를 표시한다.
- 링크 = 센터 + 교육 회차 1개. 수강생은 아무 정보도 입력하지 않는다(이름·연락처·소속 수집 금지).
- 링크마다 마감일(기본 **14일**). 마감이 지난 링크는 서버에서 응답을 거부한다.
- 제출한 응답은 **수정·삭제 불가** (수정/삭제 API를 만들지 않는다).
- 중복 제출은 막지 않는다(프로토타입).

### 대시보드 (must 2)
- 회사 담당자: 전체 센터 / 센터 담당자: **자기 센터 데이터만**. 단, 비교 차트에서 전체 평균과의 비교는 허용.
- 권한 필터는 클라이언트가 아니라 **서버의 데이터 조회 단계**에서 적용한다.
- 점수는 **소수점 첫째 자리**까지 표시.
- 응답 **5건 미만** 센터는 평균 대신 "응답 부족"으로 표시하고 비교 차트에서 제외한다.
- 교육 회차별 조회를 지원한다.
- 서술 의견 AI 요약은 **원문에 없는 내용을 만들어 넣지 않는다**(프롬프트에 명시). 원문이 외부 AI 서비스로 전송된다는 안내를 담당자 화면에 표시한다.

### 만들지 않는 것 (PRD 6장 비범위)
수강생 회원가입·로그인, 수강생 개인정보 수집, 수강신청·출석·결제, 센터별 문항 변경, 응답 수정·삭제,
재심사 점수 자동 산정·합격 판정, 담당자 회원가입 화면, 모바일 앱, 이메일·문자 발송.

## 7. 보안·개인정보

- API 키·토큰은 **`.env`에만** 둔다. 코드, 화면, 로그, 커밋, 채팅 출력에 값을 쓰지 않는다. `.env` 내용을 출력하거나 읽어서 보여주지 않는다.
- 서버 전용 키에는 `NEXT_PUBLIC_` 접두사를 절대 붙이지 않는다(브라우저로 노출됨). AI 호출은 서버 코드에서만 한다.
- `.env*`는 `.gitignore`에 등록되어 있다. 배포 시에는 Vercel 환경 변수에 따로 입력한다.
- 담당자 비밀번호는 원문 저장 금지 — 해시(bcrypt/argon2 등)로 저장한다. 계정은 미리 만들어 둔 시드 계정을 쓴다.
- 응답 데이터는 내부용이다. 수강생 화면에는 다른 사람의 응답이 절대 보이지 않아야 한다.

## 8. 작업 방식

- PRD의 **개발 단위 1→10 순서**대로 진행한다. 한 번에 한 단위씩 만들고, 끝나면 무엇을 했는지 짧게 보고한다.
- 작업을 마치기 전에 `npm run lint`와 `npm run build`가 통과하는지 확인한다. 실패하면 숨기지 말고 그대로 보고한다.
- UI 문구는 **한국어**로 작성한다. (`app/layout.tsx`의 `lang="en"`과 기본 metadata는 서비스에 맞게 `ko`로 바꿀 예정)
- 커밋·푸시·배포는 사용자가 요청할 때만 한다.
- 결정되지 않은 사항(저장 방식, AI 서비스 종류, 차트 라이브러리 등)은 임의로 정하지 말고 선택지를 제시해 사용자에게 묻는다.
- **확정된 결정은 [DESIGN.md](DESIGN.md) §2.3·§2.4가 우선한다.** 저장 방식은 Supabase, AI 모델은 `gpt-5.4-nano`로 확정되었고(위 §2·§9의 "미정" 표기는 낡은 것), Supabase는 서버 전용 비공개 키와 RLS 규칙(§2.4)을 지켜 쓴다.
- **검증하지 않은 것을 "통과"라고 쓰지 않는다.** 작업마다 `npm run lint`·`npx tsc --noEmit`을 돌리고 화면을 바꿨으면 브라우저에서 직접 확인하며, 못 돌린 검사(`npm run build`는 개발 서버를 끈 뒤에만 실행, `npm audit` 등)와 서브에이전트가 알려 준 것 중 직접 확인하지 못한 내용은 "미확인"으로 적는다. 코드 검색은 `grep` 대신 `git grep`을 쓴다(이 환경의 `grep`은 옵션이 달라 오류가 난다).

## 9. 확정된 결정과 남은 미정 사항

확정 (2026-10-15)
- [x] 응답 저장: Supabase (서울 리전)
- [x] AI: 서술 의견 요약은 `gpt-5.4-nano`, 결과 보고서는 `gpt-5.4-mini` (모두 OpenAI, 서버에서만 호출)
- [x] 담당자 로그인: 직접 구현 (아이디·비밀번호 + `bcryptjs`, 8시간 입장권 `jose`, 시작 화면에서 역할 선택)
- [x] 비교 차트: Recharts
- [x] 글꼴: Pretendard

미정 / 남은 일
- [ ] 접속 주소(IP)별 제출·로그인 제한 (인프라 필요)
- [ ] 정식 개인정보 처리방침 문구와 보관 기간, 응답 삭제 절차
- [ ] 실제 센터명·교육명 (지금은 가상 샘플)
- [ ] Vercel 배포와 운영 DB 분리
