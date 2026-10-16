-- 교육 이름(프로그램명) 추가: 수강생이 "어떤 센터의 어떤 교육"인지 알아볼 수 있게 화면에 보여 준다.
alter table public.sessions add column course_name text not null default '';
