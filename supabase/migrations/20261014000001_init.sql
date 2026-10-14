-- =============================================================================
-- SSquare — initial schema
-- Tables, integrity rules, Row Level Security, and RPCs used by the app.
-- All money is stored in whole rupees (integer). All times are timestamptz;
-- "day" logic uses India Standard Time (Asia/Kolkata).
-- =============================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.staff_role as enum ('owner', 'caretaker');
create type public.booking_status as enum ('confirmed', 'completed', 'cancelled');
create type public.payment_kind as enum ('advance', 'settlement', 'refund');
create type public.payment_method as enum ('upi', 'cash');
create type public.advance_action as enum ('kept', 'refunded');

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Staff profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  role public.staff_role not null default 'caretaker',
  permissions text[] not null default '{today_bookings}',
  locale text not null default 'en' check (locale in ('en', 'gu', 'hi')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Courts & rates
-- ---------------------------------------------------------------------------
create table public.courts (
  slug text primary key,
  name_i18n jsonb not null,
  sports text[] not null default '{}',
  is_active boolean not null default true,
  sort smallint not null default 0
);

create table public.rate_rules (
  id uuid primary key default gen_random_uuid(),
  court_slug text not null references public.courts (slug) on update cascade,
  day_type text not null default 'all' check (day_type in ('all', 'weekday', 'weekend')),
  start_minute smallint not null check (start_minute between 0 and 1439),
  end_minute smallint not null check (end_minute between 1 and 1440),
  price_per_hour integer not null check (price_per_hour >= 0),
  created_at timestamptz not null default now()
);
create index rate_rules_court_idx on public.rate_rules (court_slug);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create sequence public.booking_code_seq start 1001;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('SSQ-' || nextval('public.booking_code_seq')),
  court_slug text not null references public.courts (slug) on update cascade,
  sport text,
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  customer_phone text not null check (customer_phone ~ '^[0-9]{10}$'),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  start_at timestamptz not null,
  end_at timestamptz not null,
  total_amount integer not null check (total_amount >= 0),
  extra_amount integer not null default 0 check (extra_amount >= 0),
  status public.booking_status not null default 'confirmed',
  booked_by uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  completed_by uuid references public.profiles (id),
  completed_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  cancel_reason text,
  advance_action public.advance_action,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_order check (end_at > start_at),
  constraint bookings_max_length check (end_at - start_at <= interval '24 hours'),
  -- The heart of the system: a court can never be double-booked.
  constraint bookings_no_overlap exclude using gist (
    court_slug with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status <> 'cancelled')
);
create index bookings_start_idx on public.bookings (start_at);
create index bookings_phone_idx on public.bookings (customer_phone);
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Payments (advance, settlement on completion, refund on cancellation)
-- received_by = who physically received the money (important for cash).
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind public.payment_kind not null,
  method public.payment_method not null,
  amount integer not null check (amount > 0),
  received_by uuid not null references public.profiles (id),
  recorded_by uuid not null references public.profiles (id) default auth.uid(),
  screenshot_path text,
  note text,
  created_at timestamptz not null default now()
);
create index payments_booking_idx on public.payments (booking_id);
create index payments_created_idx on public.payments (created_at);

-- ---------------------------------------------------------------------------
-- Expenses
-- ---------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  amount integer not null check (amount > 0),
  category text not null,
  description text not null check (char_length(description) between 1 and 300),
  expense_by uuid not null references public.profiles (id),
  payment_method text not null check (payment_method in ('cash', 'upi', 'card', 'bank')),
  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_spent_on_idx on public.expenses (spent_on);
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications (profile_id, created_at desc);

-- =============================================================================
-- Helper functions (used by RLS and RPCs)
-- =============================================================================
create or replace function public.ist_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Kolkata')::date
$$;

create or replace function public.ist_day_start(p_date date)
returns timestamptz language sql stable as $$
  select p_date::timestamp at time zone 'Asia/Kolkata'
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_active)
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_active and role = 'owner')
$$;

create or replace function public.has_perm(p_perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and is_active and (role = 'owner' or p_perm = any (permissions))
  )
$$;

create or replace function public.overlaps_today(p_start timestamptz, p_end timestamptz)
returns boolean language sql stable as $$
  select tstzrange(p_start, p_end, '[)') &&
         tstzrange(public.ist_day_start(public.ist_today()), public.ist_day_start(public.ist_today() + 1), '[)')
$$;

-- Can the current user see / handle (complete, cancel) this booking?
create or replace function public.can_handle_booking(p_start timestamptz, p_end timestamptz)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_perm('all_bookings')
      or (public.has_perm('today_bookings') and public.overlaps_today(p_start, p_end))
$$;

-- =============================================================================
-- Views
-- =============================================================================
-- Bookings with paid / remaining amounts. security_invoker → RLS of the caller applies.
create view public.booking_summary with (security_invoker = true) as
select
  b.*,
  coalesce(p.paid, 0)::integer as paid_amount,
  (b.total_amount + b.extra_amount - coalesce(p.paid, 0))::integer as remaining_amount
from public.bookings b
left join lateral (
  select sum(case when kind = 'refund' then -amount else amount end) as paid
  from public.payments where booking_id = b.id
) p on true;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.rate_rules enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;

-- Profiles: staff can see each other's names (for "booked by", "received by").
-- Changes go through the server (service role) after an owner check.
create policy "staff read profiles" on public.profiles
  for select to authenticated using (public.is_staff());

-- Courts & rates: public read, owners write.
create policy "anyone reads courts" on public.courts
  for select to anon, authenticated using (true);
create policy "owners manage courts" on public.courts
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "anyone reads rates" on public.rate_rules
  for select to anon, authenticated using (true);
create policy "owners manage rates" on public.rate_rules
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Bookings: caretakers see today's only (by default); owners see all.
-- Creating / completing / cancelling goes through RPCs below.
create policy "staff read bookings" on public.bookings
  for select to authenticated using (public.can_handle_booking(start_at, end_at));
create policy "owners edit bookings" on public.bookings
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- Payments: visible when the booking is visible.
create policy "staff read payments" on public.payments
  for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id));

-- Expenses
create policy "expenses read" on public.expenses
  for select to authenticated using (public.has_perm('expenses'));
create policy "expenses insert" on public.expenses
  for insert to authenticated with check (public.has_perm('expenses') and created_by = auth.uid());
create policy "expenses update" on public.expenses
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "expenses delete" on public.expenses
  for delete to authenticated using (public.is_owner());

-- Push subscriptions: each user manages their own devices.
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and public.is_staff());

-- In-app notifications: own only.
create policy "own notifications read" on public.notifications
  for select to authenticated using (profile_id = auth.uid());
create policy "own notifications update" on public.notifications
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- =============================================================================
-- RPCs
-- =============================================================================

-- Public availability: only times, never customer details.
create or replace function public.get_public_availability(p_date date)
returns table (court_slug text, start_at timestamptz, end_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.court_slug, b.start_at, b.end_at
  from bookings b
  where b.status <> 'cancelled'
    and p_date between public.ist_today() - 1 and public.ist_today() + 120
    and tstzrange(b.start_at, b.end_at, '[)') &&
        tstzrange(public.ist_day_start(p_date), public.ist_day_start(p_date + 1), '[)')
  order by b.start_at
$$;

-- Create a booking (+ optional advance payment) in one transaction.
create or replace function public.create_booking(
  p_court_slug text,
  p_sport text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_total_amount integer,
  p_booked_by uuid,
  p_advance_amount integer default 0,
  p_advance_method public.payment_method default null,
  p_advance_received_by uuid default null,
  p_notes text default null
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  b bookings;
begin
  if not public.has_perm('create_booking') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if coalesce(p_advance_amount, 0) < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;
  if coalesce(p_advance_amount, 0) > p_total_amount then
    raise exception 'ADVANCE_TOO_HIGH';
  end if;

  insert into bookings (
    court_slug, sport, customer_name, customer_phone, customer_email,
    start_at, end_at, total_amount, booked_by, created_by, notes
  ) values (
    p_court_slug, nullif(p_sport, ''), trim(p_customer_name), p_customer_phone,
    nullif(trim(coalesce(p_customer_email, '')), ''),
    p_start_at, p_end_at, p_total_amount, coalesce(p_booked_by, me), me, nullif(p_notes, '')
  ) returning * into b;

  if coalesce(p_advance_amount, 0) > 0 then
    insert into payments (booking_id, kind, method, amount, received_by, recorded_by)
    values (b.id, 'advance', coalesce(p_advance_method, 'upi'), p_advance_amount,
            coalesce(p_advance_received_by, p_booked_by, me), me);
  end if;

  return b;
end $$;

-- Take the final payment and mark the booking completed.
create or replace function public.complete_booking(
  p_booking_id uuid,
  p_upi integer default 0,
  p_cash integer default 0,
  p_extra integer default 0,
  p_screenshot_path text default null,
  p_note text default null
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  b bookings;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if not public.can_handle_booking(b.start_at, b.end_at) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if b.status <> 'confirmed' then raise exception 'BOOKING_NOT_ACTIVE'; end if;
  if least(coalesce(p_upi, 0), coalesce(p_cash, 0), coalesce(p_extra, 0)) < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if coalesce(p_upi, 0) > 0 then
    insert into payments (booking_id, kind, method, amount, received_by, recorded_by, screenshot_path, note)
    values (b.id, 'settlement', 'upi', p_upi, me, me, p_screenshot_path, p_note);
  end if;
  if coalesce(p_cash, 0) > 0 then
    insert into payments (booking_id, kind, method, amount, received_by, recorded_by, note)
    values (b.id, 'settlement', 'cash', p_cash, me, me, p_note);
  end if;

  update bookings set
    extra_amount = extra_amount + coalesce(p_extra, 0),
    status = 'completed',
    completed_by = me,
    completed_at = now()
  where id = b.id
  returning * into b;

  return b;
end $$;

-- Cancel a booking. Advance is either kept (counted as earning) or refunded.
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_advance_action public.advance_action default 'kept',
  p_reason text default null
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  b bookings;
  has_paid boolean;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if not public.can_handle_booking(b.start_at, b.end_at) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if b.status <> 'confirmed' then raise exception 'BOOKING_NOT_ACTIVE'; end if;

  select exists (select 1 from payments where booking_id = b.id) into has_paid;

  if has_paid and p_advance_action = 'refunded' then
    -- Refund each person's net collection with the same method it was paid by.
    insert into payments (booking_id, kind, method, amount, received_by, recorded_by, note)
    select b.id, 'refund', method,
           sum(case when kind = 'refund' then -amount else amount end),
           received_by, me, 'Refund on cancellation'
    from payments where booking_id = b.id
    group by method, received_by
    having sum(case when kind = 'refund' then -amount else amount end) > 0;
  end if;

  update bookings set
    status = 'cancelled',
    cancelled_by = me,
    cancelled_at = now(),
    cancel_reason = nullif(trim(coalesce(p_reason, '')), ''),
    advance_action = case when has_paid then p_advance_action else null end
  where id = b.id
  returning * into b;

  return b;
end $$;

-- What the current user collected on a day (caretaker's "My collection" card).
create or replace function public.my_collection(p_date date default null)
returns table (method public.payment_method, amount bigint)
language sql stable security definer set search_path = public as $$
  select p.method, sum(case when p.kind = 'refund' then -p.amount else p.amount end)
  from payments p
  where p.received_by = auth.uid()
    and public.is_staff()
    and p.created_at >= public.ist_day_start(coalesce(p_date, public.ist_today()))
    and p.created_at < public.ist_day_start(coalesce(p_date, public.ist_today()) + 1)
  group by p.method
$$;

-- Payments in a date range, grouped by method and receiver (owners' dashboard & analytics).
create or replace function public.collection_summary(p_from date, p_to date)
returns table (method public.payment_method, received_by uuid, amount bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select p.method, p.received_by, sum(case when p.kind = 'refund' then -p.amount else p.amount end)
    from payments p
    where p.created_at >= public.ist_day_start(p_from)
      and p.created_at < public.ist_day_start(p_to + 1)
    group by p.method, p.received_by;
end $$;

create or replace function public.set_my_locale(p_locale text)
returns void language sql security definer set search_path = public as $$
  update profiles set locale = p_locale where id = auth.uid() and p_locale in ('en', 'gu', 'hi')
$$;

-- Lock down function execution.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_availability(date) to anon, authenticated;
grant execute on function
  public.ist_today(), public.ist_day_start(date), public.is_staff(), public.is_owner(),
  public.has_perm(text), public.overlaps_today(timestamptz, timestamptz),
  public.can_handle_booking(timestamptz, timestamptz),
  public.create_booking(text, text, text, text, text, timestamptz, timestamptz, integer, uuid, integer, public.payment_method, uuid, text),
  public.complete_booking(uuid, integer, integer, integer, text, text),
  public.cancel_booking(uuid, public.advance_action, text),
  public.my_collection(date), public.collection_summary(date, date), public.set_my_locale(text)
to authenticated;

-- Anonymous visitors never touch tables directly except courts & rates.
revoke all on public.bookings, public.payments, public.expenses, public.profiles,
  public.push_subscriptions, public.notifications, public.booking_summary from anon;

-- =============================================================================
-- Realtime (staff screens refresh instantly)
-- =============================================================================
alter publication supabase_realtime add table public.bookings, public.payments, public.notifications;

-- =============================================================================
-- Storage: private bucket for UPI payment screenshots
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "staff upload payment proofs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs' and public.is_staff());

create policy "staff read payment proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_staff());
