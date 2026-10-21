-- "Today" for the staff app runs from 12 AM today until 6 AM the next morning,
-- so late-night bookings (12 AM – 6 AM) show in today's list for owners and the caretaker.
-- Keep the 6 hours in sync with businessConfig.todayExtendsToHour in src/config/business.ts.
create or replace function public.overlaps_today(p_start timestamptz, p_end timestamptz)
returns boolean language sql stable as $$
  select tstzrange(p_start, p_end, '[)') &&
         tstzrange(public.ist_day_start(public.ist_today()),
                   public.ist_day_start(public.ist_today() + 1) + interval '6 hours', '[)')
$$;
