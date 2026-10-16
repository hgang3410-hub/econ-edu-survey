-- 프로토타입: 수강생은 긴 링크 대신 숫자 6자리 코드로 설문에 들어간다.
-- 링크(긴 무작위 값)는 그대로 두고, 코드는 링크를 찾는 짧은 별명이다.

-- 1) 겹치지 않는 6자리 숫자 코드를 만든다.
create function public.new_link_code() returns text
language plpgsql set search_path = '' as $$
declare c text;
begin
  loop
    c := lpad(floor(random() * 1000000)::int::text, 6, '0');
    exit when not exists (select 1 from public.survey_links where code = c);
  end loop;
  return c;
end;
$$;

alter table public.survey_links add column code text;
do $$
declare r record;
begin
  for r in select id from public.survey_links where code is null loop
    update public.survey_links set code = public.new_link_code() where id = r.id;
  end loop;
end;
$$;
alter table public.survey_links alter column code set not null;
alter table public.survey_links alter column code set default public.new_link_code();
alter table public.survey_links add constraint survey_links_code_key unique (code);
alter table public.survey_links add constraint survey_links_code_format check (code ~ '^[0-9]{6}$');

-- 2) 코드로 링크 찾기. 6자리는 무작위로 찍어 볼 수 있으므로, 틀린 코드 입력이 1분에 30번을 넘으면 잠시 막는다.
create table public.code_lookup_failures (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now()
);
create index code_lookup_failures_at_idx on public.code_lookup_failures (attempted_at);
alter table public.code_lookup_failures enable row level security;
revoke all on public.code_lookup_failures from anon, authenticated;

create function public.find_link_by_code(p_code text) returns text
language plpgsql set search_path = '' as $$
declare found_id text;
begin
  if (select count(*) from public.code_lookup_failures where attempted_at > now() - interval '1 minute') > 30 then
    raise exception 'too_many_attempts';
  end if;
  select id into found_id from public.survey_links where code = p_code;
  if found_id is null then
    insert into public.code_lookup_failures default values;
    delete from public.code_lookup_failures where attempted_at < now() - interval '1 day';
  end if;
  return found_id;
end;
$$;
revoke all on function public.find_link_by_code(text) from public, anon, authenticated;
revoke all on function public.new_link_code() from public, anon, authenticated;
