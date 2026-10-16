-- 교육(course)별 분석: 같은 센터 안에서 교육 이름으로도 나눠 보고, 교육끼리 비교할 수 있게 한다.
-- Design Ref: §4.3·§4.4 확장 — 집계·서술 조회·요약 저장에 "교육 이름" 조건을 더한다. 5건 미만은 평균을 내보내지 않는 규칙은 그대로다.

-- 1) 한 회차에 교육이 여러 개 있을 수 있게 하고, 요약 저장에 교육 이름을 더한다.
alter table public.sessions drop constraint sessions_center_id_round_name_key;
alter table public.sessions add constraint sessions_center_round_course_key unique (center_id, round_name, course_name);

alter table public.summaries add column course_name text not null default '';
alter table public.summaries drop constraint summaries_center_id_round_name_key;
alter table public.summaries add constraint summaries_center_round_course_key unique (center_id, round_name, course_name);

-- 2) 센터별 집계에 교육 조건 추가 (p_course가 비어 있으면 모든 교육)
drop function public.center_stats(text, uuid, integer);
create function public.center_stats(p_round text default null, p_center uuid default null, p_min integer default 5, p_course text default null)
returns table (
  center_id uuid, center_name text, response_count bigint,
  q1 numeric, q2 numeric, q3 numeric, q4 numeric, q5 numeric, q6 numeric, q7 numeric, q8 numeric
)
language sql stable set search_path = '' as $$
  select c.id, c.name, count(r.id),
         case when count(r.id) >= p_min then avg(r.q1) end,
         case when count(r.id) >= p_min then avg(r.q2) end,
         case when count(r.id) >= p_min then avg(r.q3) end,
         case when count(r.id) >= p_min then avg(r.q4) end,
         case when count(r.id) >= p_min then avg(r.q5) end,
         case when count(r.id) >= p_min then avg(r.q6) end,
         case when count(r.id) >= p_min then avg(r.q7) end,
         case when count(r.id) >= p_min then avg(r.q8) end
  from public.centers c
  left join public.sessions s on s.center_id = c.id
       and (p_round is null or s.round_name = p_round)
       and (p_course is null or s.course_name = p_course)
  left join public.survey_links l on l.session_id = s.id
  left join public.responses r on r.link_id = l.id
  where p_center is null or c.id = p_center
  group by c.id, c.name
  order by c.name
$$;

-- 3) 서술 의견 조회에 교육 조건 추가
drop function public.comment_rows(uuid, text, integer);
create function public.comment_rows(p_center uuid, p_round text default null, p_limit integer default 200, p_course text default null)
returns table (q9 text, q10 text)
language sql stable set search_path = '' as $$
  select r.q9, r.q10
  from public.responses r
  join public.survey_links l on l.id = r.link_id
  join public.sessions s on s.id = l.session_id
  where s.center_id = p_center
    and (p_round is null or s.round_name = p_round)
    and (p_course is null or s.course_name = p_course)
    and (r.q9 <> '' or r.q10 <> '')
  order by r.submitted_at desc
  limit p_limit
$$;

-- 4) 한 센터의 교육별(교육 이름 + 회차) 집계: 응답 수와 문항별 평균 (5건 미만이면 평균은 비움)
create function public.course_stats(p_center uuid, p_round text default null, p_min integer default 5)
returns table (
  course_name text, round_name text, education_date date, response_count bigint,
  q1 numeric, q2 numeric, q3 numeric, q4 numeric, q5 numeric, q6 numeric, q7 numeric, q8 numeric
)
language sql stable set search_path = '' as $$
  select s.course_name, s.round_name, min(s.education_date), count(r.id),
         case when count(r.id) >= p_min then avg(r.q1) end,
         case when count(r.id) >= p_min then avg(r.q2) end,
         case when count(r.id) >= p_min then avg(r.q3) end,
         case when count(r.id) >= p_min then avg(r.q4) end,
         case when count(r.id) >= p_min then avg(r.q5) end,
         case when count(r.id) >= p_min then avg(r.q6) end,
         case when count(r.id) >= p_min then avg(r.q7) end,
         case when count(r.id) >= p_min then avg(r.q8) end
  from public.sessions s
  left join public.survey_links l on l.session_id = s.id
  left join public.responses r on r.link_id = l.id
  where s.center_id = p_center and (p_round is null or s.round_name = p_round)
  group by s.course_name, s.round_name
  order by min(s.education_date), s.course_name
$$;

revoke execute on function public.center_stats(text, uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.comment_rows(uuid, text, integer, text) from public, anon, authenticated;
revoke execute on function public.course_stats(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.center_stats(text, uuid, integer, text) to service_role;
grant execute on function public.comment_rows(uuid, text, integer, text) to service_role;
grant execute on function public.course_stats(uuid, text, integer) to service_role;
