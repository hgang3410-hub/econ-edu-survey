-- 대시보드 집계용 함수. 서버 전용 키로만 부를 수 있다. (공개 역할 실행 권한 없음)
-- Design Ref: §4.3 — 센터별 평균·응답 수는 DB에서 계산해 숫자만 가져온다. 원자료를 서버로 대량 전송하지 않는다.

-- 센터별 응답 수와 문항별 평균. p_round가 비어 있으면 모든 회차, p_center가 비어 있으면 모든 센터.
create function public.center_stats(p_round text default null, p_center uuid default null)
returns table (
  center_id uuid, center_name text, response_count bigint,
  q1 numeric, q2 numeric, q3 numeric, q4 numeric, q5 numeric, q6 numeric, q7 numeric, q8 numeric
)
language sql stable as $$
  select c.id, c.name, count(r.id),
         avg(r.q1), avg(r.q2), avg(r.q3), avg(r.q4), avg(r.q5), avg(r.q6), avg(r.q7), avg(r.q8)
  from public.centers c
  left join public.sessions s on s.center_id = c.id and (p_round is null or s.round_name = p_round)
  left join public.survey_links l on l.session_id = s.id
  left join public.responses r on r.link_id = l.id
  where p_center is null or c.id = p_center
  group by c.id, c.name
  order by c.name
$$;

-- 전체 평균: 응답이 p_min건 이상인 센터들의 모든 응답 점수(8문항)의 평균. 숫자 하나만 돌려준다.
create function public.overall_average(p_round text default null, p_min integer default 5)
returns numeric
language sql stable as $$
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
  select avg(score) from scoped where center_id in (select center_id from qualified)
$$;

-- 서술 의견(Q9·Q10)이 있는 응답을 최근 순으로 가져온다. 요약에 쓴다.
create function public.comment_rows(p_center uuid, p_round text default null, p_limit integer default 200)
returns table (q9 text, q10 text)
language sql stable as $$
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

-- 함수는 기본적으로 모두가 실행할 수 있으므로 공개 역할의 실행 권한을 명시적으로 뺀다.
revoke execute on function public.center_stats(text, uuid) from public, anon, authenticated;
revoke execute on function public.overall_average(text, integer) from public, anon, authenticated;
revoke execute on function public.comment_rows(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.block_response_changes() from public, anon, authenticated;
grant execute on function public.center_stats(text, uuid) to service_role;
grant execute on function public.overall_average(text, integer) to service_role;
grant execute on function public.comment_rows(uuid, text, integer) to service_role;
