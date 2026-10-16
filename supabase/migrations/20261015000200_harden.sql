-- 점검 결과 반영: 집계 함수 보강, 응답 저장을 한 번에(원자적으로) 처리
-- Design Ref: §4.1·§4.3 — 5건 미만 평균은 DB에서도 내보내지 않고, 제출 속도 확인과 저장을 같은 잠금 안에서 한다.

-- 1) 센터별 집계: 응답이 p_min건 미만이면 평균을 계산해 돌려주지 않는다. (응답 수만 돌려줌)
drop function public.center_stats(text, uuid);
create function public.center_stats(p_round text default null, p_center uuid default null, p_min integer default 5)
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
  left join public.sessions s on s.center_id = c.id and (p_round is null or s.round_name = p_round)
  left join public.survey_links l on l.session_id = s.id
  left join public.responses r on r.link_id = l.id
  where p_center is null or c.id = p_center
  group by c.id, c.name
  order by c.name
$$;

-- 2) 전체 평균: 평균과 함께 "몇 개 센터를 기준으로 계산했는지"를 돌려준다. (센터가 너무 적으면 화면에서 가린다)
drop function public.overall_average(text, integer);
create function public.overall_stats(p_round text default null, p_min integer default 5)
returns table (average numeric, center_count integer)
language sql stable set search_path = '' as $$
  with scoped as (
    select s.center_id,
           (r.q1 + r.q2 + r.q3 + r.q4 + r.q5 + r.q6 + r.q7 + r.q8) / 8.0 as score
    from public.responses r
    join public.survey_links l on l.id = r.link_id
    join public.sessions s on s.id = l.session_id
    where p_round is null or s.round_name = p_round
  ),
  qualified as (
    select center_id from scoped group by center_id having count(*) >= p_min
  )
  select avg(score), (select count(*)::integer from qualified)
  from scoped where center_id in (select center_id from qualified)
$$;

-- 3) 서술 의견 조회: 함수 경로 고정
create or replace function public.comment_rows(p_center uuid, p_round text default null, p_limit integer default 200)
returns table (q9 text, q10 text)
language sql stable set search_path = '' as $$
  select r.q9, r.q10
  from public.responses r
  join public.survey_links l on l.id = r.link_id
  join public.sessions s on s.id = l.session_id
  where s.center_id = p_center
    and (p_round is null or s.round_name = p_round)
    and (r.q9 <> '' or r.q10 <> '')
  order by r.submitted_at desc
  limit p_limit
$$;

-- 4) 응답 저장: 링크 확인 → 마감 확인 → 제출 속도 확인 → 저장을 링크별 잠금 안에서 한 번에 처리한다.
--    (동시에 많이 보내도 속도 제한을 넘지 못한다)
create function public.submit_response(
  p_link_id text,
  p_q1 smallint, p_q2 smallint, p_q3 smallint, p_q4 smallint,
  p_q5 smallint, p_q6 smallint, p_q7 smallint, p_q8 smallint,
  p_q9 text, p_q10 text, p_max_per_minute integer
) returns text
language plpgsql set search_path = '' as $$
declare
  v_closes timestamptz;
  v_recent integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_link_id));

  select closes_at into v_closes from public.survey_links where id = p_link_id;
  if not found then return 'invalid-link'; end if;
  if v_closes < now() then return 'closed'; end if;

  select count(*) into v_recent from public.responses
   where link_id = p_link_id and submitted_at > now() - interval '1 minute';
  if v_recent >= p_max_per_minute then return 'too-many'; end if;

  insert into public.responses (link_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10)
  values (p_link_id, p_q1, p_q2, p_q3, p_q4, p_q5, p_q6, p_q7, p_q8, p_q9, p_q10);
  return 'saved';
end;
$$;

-- 새 함수도 서버 전용 키(service_role)만 실행할 수 있게 한다.
revoke execute on function public.center_stats(text, uuid, integer) from public, anon, authenticated;
revoke execute on function public.overall_stats(text, integer) from public, anon, authenticated;
revoke execute on function public.comment_rows(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.submit_response(text, smallint, smallint, smallint, smallint, smallint, smallint, smallint, smallint, text, text, integer) from public, anon, authenticated;
grant execute on function public.center_stats(text, uuid, integer) to service_role;
grant execute on function public.overall_stats(text, integer) to service_role;
grant execute on function public.comment_rows(uuid, text, integer) to service_role;
grant execute on function public.submit_response(text, smallint, smallint, smallint, smallint, smallint, smallint, smallint, smallint, text, text, integer) to service_role;
