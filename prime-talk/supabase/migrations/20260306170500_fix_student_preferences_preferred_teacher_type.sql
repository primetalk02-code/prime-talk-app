alter table if exists public.student_preferences
  add column if not exists preferred_teacher_type text;

alter table if exists public.student_preferences
  alter column preferred_teacher_type set default 'any';

update public.student_preferences
set preferred_teacher_type = 'any'
where preferred_teacher_type is null
   or btrim(preferred_teacher_type) = '';

alter table if exists public.student_preferences
  alter column preferred_teacher_type set not null;
