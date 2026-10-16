-- 지역경제교육 만족도 조사 서비스: 초기 테이블
-- Design Ref: §5 데이터 구조, §2.4 Supabase 접근 방식 (서버 전용 키, 모든 테이블 RLS 켬)

-- 센터
create table public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- 교육 회차. 회차 이름은 센터 공통이다 (예: "2026년 3분기")
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers (id),
  round_name text not null,
  education_date date not null,
  unique (center_id, round_name)
);

-- 설문 링크. id가 링크 주소에 들어가는 추측하기 어려운 무작위 값이다. 교육 1회당 1개.
create table public.survey_links (
  id text primary key check (char_length(id) >= 22),
  session_id uuid not null unique references public.sessions (id),
  closes_at timestamptz not null
);

-- 수강생 응답. 이름·연락처·IP·접속 기기 정보는 저장하지 않는다.
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  link_id text not null references public.survey_links (id),
  q1 smallint not null check (q1 between 1 and 5),
  q2 smallint not null check (q2 between 1 and 5),
  q3 smallint not null check (q3 between 1 and 5),
  q4 smallint not null check (q4 between 1 and 5),
  q5 smallint not null check (q5 between 1 and 5),
  q6 smallint not null check (q6 between 1 and 5),
  q7 smallint not null check (q7 between 1 and 5),
  q8 smallint not null check (q8 between 1 and 5),
  q9 text not null default '' check (char_length(q9) <= 500),
  q10 text not null default '' check (char_length(q10) <= 500),
  submitted_at timestamptz not null default now()
);
create index responses_link_id_idx on public.responses (link_id, submitted_at);

-- 담당자 계정. 비밀번호는 암호문(해시)으로만 저장한다.
create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('company', 'center')),
  center_id uuid references public.centers (id),
  check ((role = 'center' and center_id is not null) or (role = 'company' and center_id is null))
);

-- AI 요약 저장. 응답 수가 달라지면 새로 만든다. 서술 원문은 저장하지 않는다.
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers (id),
  round_name text not null,
  response_count integer not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (center_id, round_name)
);

-- 로그인 실패 기록 (무차별 대입 방어용). 접속 주소는 저장하지 않는다.
create table public.login_attempts (
  id bigint generated always as identity primary key,
  username text not null,
  attempted_at timestamptz not null default now()
);
create index login_attempts_username_idx on public.login_attempts (username, attempted_at);

-- 응답은 한 번 저장하면 수정·삭제·비우기를 할 수 없다. (서버 전용 키로 접근해도 막힌다)
create function public.block_response_changes() returns trigger
language plpgsql as $$
begin
  raise exception '응답은 수정하거나 삭제할 수 없습니다.';
end;
$$;

create trigger responses_block_update_delete
  before update or delete on public.responses
  for each row execute function public.block_response_changes();

create trigger responses_block_truncate
  before truncate on public.responses
  for each statement execute function public.block_response_changes();

-- 모든 테이블에 RLS를 켜고 공개(anon)·로그인(authenticated) 역할에는 어떤 권한도 주지 않는다.
-- 앱은 서버 전용 비공개 키로만 접근한다.
alter table public.centers enable row level security;
alter table public.sessions enable row level security;
alter table public.survey_links enable row level security;
alter table public.responses enable row level security;
alter table public.app_users enable row level security;
alter table public.summaries enable row level security;
alter table public.login_attempts enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
