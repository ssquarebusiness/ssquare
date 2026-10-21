-- Behaviour checks for RLS + RPCs. Run against a disposable database after the migration + seed.
-- Every check raises an exception on failure.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002'), ('00000000-0000-0000-0000-000000000003');
insert into public.profiles (id, username, display_name, role, permissions) values
  ('00000000-0000-0000-0000-000000000001', 'shail', 'Shail', 'owner', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'shubh', 'Shubh', 'owner', '{}'),
  ('00000000-0000-0000-0000-000000000003', 'ravi', 'Ravi', 'caretaker', '{today_bookings}');

-- ---- Owner creates a booking today (with ₹500 cash advance) and one tomorrow ----
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

create temp table t as
select (public.create_booking('turf', 'cricket', 'Amit Shah', '9876543210', null,
  public.ist_day_start(public.ist_today()) + interval '19 hours',
  public.ist_day_start(public.ist_today()) + interval '20 hours 30 minutes',
  1500, '00000000-0000-0000-0000-000000000001', 500, 'cash', null, null)).id as today_id;

select public.create_booking('turf', null, 'Tomorrow Guy', '9876543211', null,
  public.ist_day_start(public.ist_today() + 1) + interval '7 hours',
  public.ist_day_start(public.ist_today() + 1) + interval '8 hours', 800,
  '00000000-0000-0000-0000-000000000002', 0, null, null, null);

-- ---- Double booking must fail ----
do $$ begin
  perform public.create_booking('turf', null, 'Clash', '9876543212', null,
    public.ist_day_start(public.ist_today()) + interval '20 hours',
    public.ist_day_start(public.ist_today()) + interval '21 hours', 1000, null, 0, null, null, null);
  raise exception 'FAIL: overlap allowed';
exception when exclusion_violation then raise notice 'ok: overlap blocked';
end $$;

-- Same time on the other court is fine
select public.create_booking('pickleball', null, 'Pickle', '9876543213', null,
  public.ist_day_start(public.ist_today()) + interval '19 hours',
  public.ist_day_start(public.ist_today()) + interval '20 hours', 400, null, 0, null, null, null);

-- ---- Caretaker: sees only today's bookings, no expenses, cannot create ----
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
do $$ begin
  if (select count(*) from public.bookings) <> 2 then raise exception 'FAIL: caretaker sees % bookings', (select count(*) from public.bookings); end if;
  if (select count(*) from public.payments) <> 1 then raise exception 'FAIL: caretaker payments'; end if;
  raise notice 'ok: caretaker sees only today';
end $$;
do $$ begin
  perform * from public.expenses;
  if found then raise exception 'FAIL'; end if;
  insert into public.expenses (spent_on, amount, category, description, expense_by, payment_method)
    values (current_date, 10, 'other', 'x', '00000000-0000-0000-0000-000000000003', 'cash');
  raise exception 'FAIL: caretaker inserted expense';
exception when insufficient_privilege then raise notice 'ok: caretaker blocked from expenses';
end $$;
do $$ begin
  perform public.create_booking('turf', null, 'X', '9876543219', null, now() + interval '3 days', now() + interval '3 days 1 hour', 1, null, 0, null, null, null);
  raise exception 'FAIL: caretaker created booking';
exception when insufficient_privilege then raise notice 'ok: caretaker cannot create booking';
end $$;

-- ---- Caretaker completes: ₹700 UPI + ₹400 cash + ₹40 water ----
select public.complete_booking((select today_id from t), 700, 400, 40, 'proofs/x.webp', null);
do $$ declare r record; begin
  select * into r from public.booking_summary where id = (select today_id from t);
  if r.status <> 'completed' or r.paid_amount <> 1600 or r.remaining_amount <> -60 then
    raise exception 'FAIL: summary % % %', r.status, r.paid_amount, r.remaining_amount; end if;
  raise notice 'ok: completed, paid=%, remaining=%', r.paid_amount, r.remaining_amount;
end $$;
do $$ begin
  if (select sum(amount) from public.my_collection(null) where method = 'cash') <> 400 then raise exception 'FAIL: my_collection'; end if;
  raise notice 'ok: my_collection';
end $$;
do $$ begin
  perform * from public.collection_summary(public.ist_today(), public.ist_today());
  raise exception 'FAIL: caretaker ran collection_summary';
exception when insufficient_privilege then raise notice 'ok: collection_summary owner-only';
end $$;

-- ---- Owner cancels tomorrow's booking after an advance → refund ----
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
create temp table t2 as
select (public.create_booking('pickleball', null, 'Refund Me', '9876543214', null,
  public.ist_day_start(public.ist_today() + 2) + interval '6 hours',
  public.ist_day_start(public.ist_today() + 2) + interval '7 hours', 400, null, 200, 'upi', null, null)).id as id;
select public.cancel_booking((select id from t2), 'refunded', 'Did not come');
do $$ declare r record; begin
  select * into r from public.booking_summary where id = (select id from t2);
  if r.status <> 'cancelled' or r.paid_amount <> 0 or r.advance_action <> 'refunded' then raise exception 'FAIL: refund'; end if;
  raise notice 'ok: cancelled with refund';
end $$;
-- Freed slot can be booked again
select public.create_booking('pickleball', null, 'Rebook', '9876543215', null,
  public.ist_day_start(public.ist_today() + 2) + interval '6 hours',
  public.ist_day_start(public.ist_today() + 2) + interval '7 hours', 400, null, 0, null, null, null);
do $$ begin
  if (select count(*) from public.collection_summary(public.ist_today(), public.ist_today())) = 0 then raise exception 'FAIL'; end if;
  raise notice 'ok: owner collection_summary';
end $$;

-- ---- Optional customer name / phone ----
do $$ declare b public.bookings; begin
  b := public.create_booking('pickleball', 'pickleball', '  ', '', null,
    public.ist_day_start(public.ist_today() + 3) + interval '6 hours',
    public.ist_day_start(public.ist_today() + 3) + interval '7 hours', 400, null, 0, null, null, null);
  if b.customer_name is not null or b.customer_phone is not null then raise exception 'FAIL: blank customer not stored as null'; end if;
  raise notice 'ok: booking without customer name / phone';
end $$;

-- ---- Sport rates: owners can change, caretakers cannot ----
update public.sport_rates set weekday_price = 900 where sport = 'cricket';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
update public.sport_rates set weekday_price = 1 where sport = 'cricket';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$ begin
  if (select weekday_price from public.sport_rates where sport = 'cricket') <> 900 then raise exception 'FAIL: rate edit rules'; end if;
  raise notice 'ok: only owners change rates';
end $$;

-- ---- Anonymous visitor ----
reset role; set local role anon;
do $$ begin
  if (select count(*) from public.get_public_availability((now() at time zone 'Asia/Kolkata')::date)) <> 2 then raise exception 'FAIL: public availability'; end if;
  if (select count(*) from public.sport_rates) <> 3 then raise exception 'FAIL: sport rates hidden'; end if;
  if (select count(*) from public.courts) <> 2 then raise exception 'FAIL: courts missing'; end if;
  raise notice 'ok: public availability + rates';
end $$;
do $$ begin
  perform * from public.bookings;
  raise exception 'FAIL: anon read bookings';
exception when insufficient_privilege then raise notice 'ok: anon blocked from bookings';
end $$;
rollback;
\echo ALL_CHECKS_PASSED
