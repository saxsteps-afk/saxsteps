-- SaxSteps: full database schema for a NEW Supabase project.
--
-- Run ONCE in the Supabase SQL Editor of the SaxSteps project. Everything is
-- one transaction: if anything fails, nothing changes.
--
-- Afterwards, sign in once on the website with the owner account
-- (saxsteps@gmail.com), then run supabase/make-admin.sql.
--
-- Tables
--   courses                 the course (one row: saxsteps-30-days)
--   course_lessons          a day: number, title, free trial?, published?
--   course_items            the pieces of a day: note practice, song, bonus
--   course_item_content     score (.nhac.json) + video link of a piece   (gated)
--   course_lesson_guides    lesson text of a day                          (gated)
--   course_item_progress    each learner's best result per piece
--   course_enrollments      who owns the course
--   orders                  purchases reported by the payment provider
--   admin_users             accounts allowed to manage the course

begin;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "admin sees own row"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- course content
-- ---------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  total_days integer not null default 30 check (total_days between 1 and 365),
  -- draft: only admins and learners who own it can see it
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  day integer not null check (day between 1 and 365),
  title text not null default '',
  -- free trial day: anyone can open it once the course is published
  is_free boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, day)
);

create index course_lessons_course_id_idx on public.course_lessons (course_id);
create trigger course_lessons_set_updated_at before update on public.course_lessons
  for each row execute function public.set_updated_at();

create table public.course_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  kind text not null check (kind in ('notes', 'song', 'bonus')),
  position integer not null default 0,
  title text not null default '',
  subtitle text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, kind, title)
);

create index course_items_lesson_id_idx on public.course_items (lesson_id);
create trigger course_items_set_updated_at before update on public.course_items
  for each row execute function public.set_updated_at();

create table public.course_item_content (
  item_id uuid primary key references public.course_items (id) on delete cascade,
  score jsonb not null,
  file_name text not null default '',
  video_url text not null default '',
  updated_at timestamptz not null default now()
);

create trigger course_item_content_set_updated_at before update on public.course_item_content
  for each row execute function public.set_updated_at();

create table public.course_lesson_guides (
  lesson_id uuid primary key references public.course_lessons (id) on delete cascade,
  guide text not null default '',
  updated_at timestamptz not null default now()
);

create trigger course_lesson_guides_set_updated_at before update on public.course_lesson_guides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- learners
-- ---------------------------------------------------------------------------
create table public.course_enrollments (
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create index course_enrollments_user_id_idx on public.course_enrollments (user_id);

create table public.course_item_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null references public.course_items (id) on delete cascade,
  best_score integer not null check (best_score between 0 and 100),
  stars integer not null check (stars between 0 and 3),
  attempts integer not null default 1 check (attempts >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index course_item_progress_item_id_idx on public.course_item_progress (item_id);
create trigger course_item_progress_set_updated_at before update on public.course_item_progress
  for each row execute function public.set_updated_at();

-- Purchases. Written only by the payment webhook (service role) and admins.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                -- 'lemonsqueezy', 'manual', ...
  provider_order_id text not null,
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  status text not null check (status in ('paid', 'refunded')),
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

create index orders_email_idx on public.orders (lower(email));
create index orders_user_id_idx on public.orders (user_id);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- access rules
-- ---------------------------------------------------------------------------
create or replace function public.has_course_access(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (
      select 1 from public.course_enrollments e
      where e.course_id = p_course and e.user_id = auth.uid()
    );
$$;

revoke all on function public.has_course_access(uuid) from public;
grant execute on function public.has_course_access(uuid) to anon, authenticated;

create or replace function public.can_open_lesson(p_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.course_lessons l
      join public.courses c on c.id = l.course_id
      where l.id = p_lesson
        and l.is_published
        and (public.has_course_access(c.id) or (l.is_free and c.status = 'published'))
    );
$$;

revoke all on function public.can_open_lesson(uuid) from public;
grant execute on function public.can_open_lesson(uuid) to anon, authenticated;

alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_items enable row level security;
alter table public.course_item_content enable row level security;
alter table public.course_lesson_guides enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.course_item_progress enable row level security;
alter table public.orders enable row level security;

create policy "read published or own courses" on public.courses for select
  to anon, authenticated using (status = 'published' or public.has_course_access(id));
create policy "admin manage courses" on public.courses for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read published lessons" on public.course_lessons for select
  to anon, authenticated
  using (
    public.is_admin()
    or (is_published and exists (
      select 1 from public.courses c
      where c.id = course_id and (c.status = 'published' or public.has_course_access(c.id))
    ))
  );
create policy "admin manage lessons" on public.course_lessons for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- titles of the pieces follow the day: whoever sees the day sees its titles
create policy "read items of visible lessons" on public.course_items for select
  to anon, authenticated using (exists (select 1 from public.course_lessons l where l.id = lesson_id));
create policy "admin manage items" on public.course_items for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read content with access" on public.course_item_content for select
  to anon, authenticated
  using (exists (select 1 from public.course_items i where i.id = item_id and public.can_open_lesson(i.lesson_id)));
create policy "admin manage content" on public.course_item_content for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read guides with access" on public.course_lesson_guides for select
  to anon, authenticated using (public.can_open_lesson(lesson_id));
create policy "admin manage guides" on public.course_lesson_guides for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read own enrollments" on public.course_enrollments for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin manage enrollments" on public.course_enrollments for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read own progress" on public.course_item_progress for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "write own progress" on public.course_item_progress for insert
  to authenticated with check (user_id = auth.uid());
create policy "update own progress" on public.course_item_progress for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read own orders" on public.orders for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin manage orders" on public.orders for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- purchases
-- ---------------------------------------------------------------------------
-- Called by the payment webhook with the service role key only. Records the
-- order; when paid, unlocks the course for the buyer: by the user id passed
-- through checkout, else by an account with the same email. Refunds lock it again.
create or replace function public.record_order(
  p_provider text,
  p_provider_order_id text,
  p_course_slug text,
  p_user uuid,
  p_email text,
  p_amount_cents integer,
  p_currency text,
  p_status text,
  p_raw jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course uuid;
  v_user uuid := p_user;
  v_order uuid;
begin
  select id into v_course from public.courses where slug = p_course_slug;
  if v_course is null then
    raise exception 'unknown course %', p_course_slug;
  end if;

  if v_user is not null and not exists (select 1 from auth.users where id = v_user) then
    v_user := null;
  end if;
  if v_user is null then
    select id into v_user from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  end if;

  insert into public.orders (provider, provider_order_id, course_id, user_id, email, amount_cents, currency, status, raw)
  values (p_provider, p_provider_order_id, v_course, v_user, lower(trim(p_email)), p_amount_cents, upper(p_currency), p_status, coalesce(p_raw, '{}'))
  on conflict (provider, provider_order_id) do update
    set status = excluded.status,
        user_id = coalesce(public.orders.user_id, excluded.user_id),
        raw = excluded.raw
  returning id, user_id into v_order, v_user;

  if v_user is not null then
    if p_status = 'paid' then
      insert into public.course_enrollments (course_id, user_id, note)
      values (v_course, v_user, p_provider || ' ' || p_provider_order_id)
      on conflict (course_id, user_id) do nothing;
    elsif p_status = 'refunded' then
      delete from public.course_enrollments
       where course_id = v_course and user_id = v_user
         and not exists (
           select 1 from public.orders o
            where o.course_id = v_course and o.user_id = v_user and o.status = 'paid' and o.id <> v_order
         );
    end if;
  end if;

  return jsonb_build_object('order', v_order, 'user', v_user);
end;
$$;

revoke all on function public.record_order(text, text, text, uuid, text, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_order(text, text, text, uuid, text, integer, text, text, jsonb) to service_role;

-- Someone who paid before creating an account (or with another sign-in method)
-- gets the course as soon as they sign in with the email they paid with.
create or replace function public.claim_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_count integer := 0;
  r record;
begin
  if v_uid is null then
    return 0;
  end if;
  select lower(email) into v_email from auth.users where id = v_uid and email_confirmed_at is not null;
  if v_email is null then
    return 0;
  end if;
  for r in
    update public.orders set user_id = v_uid
     where user_id is null and lower(email) = v_email and status = 'paid'
    returning course_id, provider, provider_order_id
  loop
    insert into public.course_enrollments (course_id, user_id, note)
    values (r.course_id, v_uid, r.provider || ' ' || r.provider_order_id)
    on conflict (course_id, user_id) do nothing;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.claim_orders() from public;
grant execute on function public.claim_orders() to authenticated;

-- ---------------------------------------------------------------------------
-- admin helpers
-- ---------------------------------------------------------------------------
create or replace function public.admin_grant_course(p_course uuid, p_email text, p_note text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this.' using errcode = '42501';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No account with email %. The learner must sign up first.', trim(p_email) using errcode = 'P0002';
  end if;
  insert into public.course_enrollments (course_id, user_id, note)
  values (p_course, v_user, coalesce(p_note, ''))
  on conflict (course_id, user_id) do update set note = excluded.note;
  return v_user;
end;
$$;

revoke all on function public.admin_grant_course(uuid, text, text) from public;
grant execute on function public.admin_grant_course(uuid, text, text) to authenticated;

create or replace function public.admin_course_students(p_course uuid)
returns table (
  user_id uuid,
  email text,
  note text,
  granted_at timestamptz,
  lessons_done integer,
  last_activity timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this.' using errcode = '42501';
  end if;
  return query
  select
    e.user_id,
    u.email::text,
    e.note,
    e.created_at,
    (select count(*)::integer
       from public.course_lessons l
      where l.course_id = e.course_id
        and exists (select 1 from public.course_items i where i.lesson_id = l.id and i.kind <> 'bonus')
        and not exists (
          select 1 from public.course_items i
           where i.lesson_id = l.id and i.kind <> 'bonus'
             and not exists (select 1 from public.course_item_progress p where p.item_id = i.id and p.user_id = e.user_id)
        )),
    (select max(p.updated_at)
       from public.course_item_progress p
       join public.course_items i on i.id = p.item_id
       join public.course_lessons l on l.id = i.lesson_id
      where p.user_id = e.user_id and l.course_id = e.course_id)
  from public.course_enrollments e
  join auth.users u on u.id = e.user_id
  where e.course_id = p_course
  order by e.created_at desc;
end;
$$;

revoke all on function public.admin_course_students(uuid) from public;
grant execute on function public.admin_course_students(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- the course
-- ---------------------------------------------------------------------------
insert into public.courses (slug, title, subtitle, total_days)
values ('saxsteps-30-days', 'SaxSteps: Saxophone in 30 Days', 'From your first note to your first recital', 30);

commit;
