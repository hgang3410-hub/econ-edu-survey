-- 결과 보고서용 집계: 문항별 평균(만족도)과 "전반적 만족도(Q8)와의 상관"(파생 중요도)을 DB에서 계산한다.
-- Design Ref: 보고서 IPA 분석 — 중요도 자료가 따로 없으므로 각 문항이 전반적 만족도와 얼마나 함께 움직이는지로 중요도를 추정한다.
-- 응답이 p_min건 이상인 센터의 응답만 대상으로 한다. 서버 전용 키로만 실행할 수 있다.
create function public.report_item_stats(p_round text default null, p_min integer default 5)
returns table (item integer, mean numeric, corr_q8 numeric)
language sql stable set search_path = '' as $$
  with scoped as (
    select s.center_id, r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7, r.q8
    from public.responses r
    join public.survey_links l on l.id = r.link_id
    join public.sessions s on s.id = l.session_id
    where p_round is null or s.round_name = p_round
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

revoke execute on function public.report_item_stats(text, integer) from public, anon, authenticated;
grant execute on function public.report_item_stats(text, integer) to service_role;
