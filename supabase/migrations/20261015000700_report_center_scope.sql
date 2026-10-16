-- 결과 보고서를 센터 하나만 골라서도 만들 수 있게, 문항 집계에 센터 조건(p_center)을 더한다.
-- p_center가 비어 있으면 모든 센터. 응답이 p_min건 미만인 센터는 여전히 제외한다.
drop function public.report_item_stats(text, integer);
create function public.report_item_stats(p_round text default null, p_min integer default 5, p_center uuid default null)
returns table (item integer, mean numeric, corr_q8 numeric)
language sql stable set search_path = '' as $$
  with scoped as (
    select s.center_id, r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7, r.q8
    from public.responses r
    join public.survey_links l on l.id = r.link_id
    join public.sessions s on s.id = l.session_id
    where (p_round is null or s.round_name = p_round)
      and (p_center is null or s.center_id = p_center)
  ),
  qualified as (
    select center_id from scoped group by center_id having count(*) >= p_min
  ),
  q as (select * from scoped where center_id in (select center_id from qualified))
  select 1, avg(q1), corr(q1::float8, q8::float8)::numeric from q union all
  select 2, avg(q2), corr(q2::float8, q8::float8)::numeric from q union all
  select 3, avg(q3), corr(q3::float8, q8::float8)::numeric from q union all
  select 4, avg(q4), corr(q4::float8, q8::float8)::numeric from q union all
  select 5, avg(q5), corr(q5::float8, q8::float8)::numeric from q union all
  select 6, avg(q6), corr(q6::float8, q8::float8)::numeric from q union all
  select 7, avg(q7), corr(q7::float8, q8::float8)::numeric from q union all
  select 8, avg(q8), 1::numeric from q
$$;
revoke execute on function public.report_item_stats(text, integer, uuid) from public, anon, authenticated;
grant execute on function public.report_item_stats(text, integer, uuid) to service_role;
