-- =============================================================================
-- 1. Courts are required reference data: bookings cannot be saved without them.
--    (They used to live only in seed.sql, which was easy to miss.)
-- 2. Simple pricing: one per-hour price per sport for weekdays and weekends,
--    replacing the time-window rate_rules table.
-- 3. Customer name and phone become optional (shown as "Unknown" in the app).
-- =============================================================================

-- 1. Courts ------------------------------------------------------------------
insert into public.courts (slug, name_i18n, sports, sort) values
  ('turf', '{"en":"Turf (Cricket & Football)","gu":"ટર્ફ (ક્રિકેટ અને ફૂટબોલ)","hi":"टर्फ (क्रिकेट और फ़ुटबॉल)"}', '{cricket,football}', 1),
  ('pickleball', '{"en":"Pickleball Court","gu":"પિકલબોલ કોર્ટ","hi":"पिकलबॉल कोर्ट"}', '{pickleball}', 2)
on conflict (slug) do nothing;

-- 2. Sport rates -------------------------------------------------------------
create table public.sport_rates (
  sport text primary key,
  court_slug text not null references public.courts (slug) on update cascade,
  weekday_price integer not null default 0 check (weekday_price >= 0),
  weekend_price integer not null default 0 check (weekend_price >= 0),
  sort smallint not null default 0,
  updated_at timestamptz not null default now()
);
create trigger sport_rates_updated_at before update on public.sport_rates
  for each row execute function public.touch_updated_at();

-- Starting prices (₹ per hour) — owners change them in the app: More → Settings → Rates.
insert into public.sport_rates (sport, court_slug, weekday_price, weekend_price, sort) values
  ('cricket', 'turf', 800, 1000, 1),
  ('football', 'turf', 800, 1000, 2),
  ('pickleball', 'pickleball', 400, 500, 3)
on conflict (sport) do nothing;

alter table public.sport_rates enable row level security;
create policy "anyone reads sport rates" on public.sport_rates
  for select to anon, authenticated using (true);
create policy "owners update sport rates" on public.sport_rates
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

drop table if exists public.rate_rules;

-- Pickleball bookings record the sport too (keeps reports and pricing uniform).
update public.bookings set sport = 'pickleball' where court_slug = 'pickleball' and sport is null;

-- 3. Optional customer name / phone -------------------------------------------
alter table public.bookings alter column customer_name drop not null;
alter table public.bookings alter column customer_phone drop not null;

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
    p_court_slug,
    nullif(p_sport, ''),
    nullif(trim(coalesce(p_customer_name, '')), ''),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
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
