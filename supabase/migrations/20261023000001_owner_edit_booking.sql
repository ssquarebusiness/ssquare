-- Owners can edit a booking's details (court, sport, time, customer, total, advance, notes).
-- Caretakers cannot. The no-overlap rule still applies to the new time.
-- The advance is a payment record: changing it updates / adds / removes that record in the same step.
create or replace function public.update_booking(
  p_booking_id uuid,
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
  advance_rows integer;
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into b from bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if b.status = 'cancelled' then raise exception 'BOOKING_NOT_ACTIVE'; end if;
  if coalesce(p_advance_amount, 0) < 0 or p_total_amount < 0 then raise exception 'INVALID_AMOUNT'; end if;
  if coalesce(p_advance_amount, 0) > p_total_amount then raise exception 'ADVANCE_TOO_HIGH'; end if;

  update bookings set
    court_slug = p_court_slug,
    sport = nullif(p_sport, ''),
    customer_name = nullif(trim(coalesce(p_customer_name, '')), ''),
    customer_phone = nullif(trim(coalesce(p_customer_phone, '')), ''),
    customer_email = nullif(trim(coalesce(p_customer_email, '')), ''),
    start_at = p_start_at,
    end_at = p_end_at,
    total_amount = p_total_amount,
    booked_by = coalesce(p_booked_by, booked_by),
    notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = b.id
  returning * into b;

  -- Advance: one advance record per booking is editable here.
  select count(*) into advance_rows from payments where booking_id = b.id and kind = 'advance';
  if advance_rows > 1 then
    raise exception 'ADVANCE_NOT_EDITABLE';
  elsif advance_rows = 1 then
    if coalesce(p_advance_amount, 0) = 0 then
      delete from payments where booking_id = b.id and kind = 'advance';
    else
      update payments set
        amount = p_advance_amount,
        method = coalesce(p_advance_method, method),
        received_by = coalesce(p_advance_received_by, received_by),
        recorded_by = me
      where booking_id = b.id and kind = 'advance';
    end if;
  elsif coalesce(p_advance_amount, 0) > 0 then
    insert into payments (booking_id, kind, method, amount, received_by, recorded_by)
    values (b.id, 'advance', coalesce(p_advance_method, 'upi'), p_advance_amount,
            coalesce(p_advance_received_by, me), me);
  end if;

  return b;
end $$;

revoke execute on function public.update_booking(uuid, text, text, text, text, text, timestamptz, timestamptz, integer, uuid, integer, public.payment_method, uuid, text) from public, anon;
grant execute on function public.update_booking(uuid, text, text, text, text, text, timestamptz, timestamptz, integer, uuid, integer, public.payment_method, uuid, text) to authenticated;
