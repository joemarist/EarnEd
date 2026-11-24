-- Reinstall and strengthen the database-level payment guard.
-- This is the final safeguard even if two browser sessions submit at nearly the same time.

create index if not exists daily_logs_user_workplace_date_idx
  on public.daily_logs (user_id, workplace_id, log_date);

create index if not exists daily_logs_user_legacy_workplace_date_idx
  on public.daily_logs (user_id, workplace, log_date)
  where workplace_id is null;

create index if not exists payments_user_workplace_period_idx
  on public.payments (user_id, workplace_id, period_start, period_end);

create index if not exists payments_user_legacy_workplace_period_idx
  on public.payments (user_id, workplace_name, period_start, period_end)
  where workplace_id is null;

create index if not exists payments_user_payment_date_idx
  on public.payments (user_id, payment_date desc);

create or replace function public.validate_payment_amount()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_amount numeric(12, 2);
  already_received numeric(12, 2);
begin
  if auth.uid() is not null and auth.uid() <> new.user_id then
    raise exception 'You can only record payments for your own account.';
  end if;

  if new.amount is null or new.amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  if new.period_start is null or new.period_end is null or new.period_end < new.period_start then
    raise exception 'Please provide a valid pay-period date range.';
  end if;

  if new.workplace_id is null then
    raise exception 'A payment must be linked to a workplace.';
  end if;

  if not exists (
    select 1
    from public.workplaces w
    where w.id = new.workplace_id
      and w.user_id = new.user_id
  ) then
    raise exception 'The selected workplace does not belong to this account.';
  end if;

  -- Serialize writes for the same user, workplace, and exact pay period.
  perform pg_advisory_xact_lock(
    hashtext(new.user_id::text),
    hashtext(
      new.workplace_id::text || ':' ||
      new.period_start::text || ':' ||
      new.period_end::text
    )
  );

  select coalesce(sum(dl.income), 0)
    into expected_amount
  from public.daily_logs dl
  where dl.user_id = new.user_id
    and (
      dl.workplace_id = new.workplace_id
      or (dl.workplace_id is null and dl.workplace = new.workplace_name)
    )
    and dl.log_date between new.period_start and new.period_end;

  if expected_amount <= 0 then
    raise exception 'No Daily Logs income exists for this workplace and pay period.';
  end if;

  select coalesce(sum(p.amount), 0)
    into already_received
  from public.payments p
  where p.user_id = new.user_id
    and (
      p.workplace_id = new.workplace_id
      or (p.workplace_id is null and p.workplace_name = new.workplace_name)
    )
    and p.period_start = new.period_start
    and p.period_end = new.period_end
    and p.id is distinct from new.id;

  if already_received >= expected_amount then
    raise exception 'This pay period is already fully paid. No additional payment can be recorded.';
  end if;

  if new.amount > expected_amount - already_received then
    raise exception 'Payment exceeds the remaining balance for this pay period.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_payment_overpayment on public.payments;

create trigger prevent_payment_overpayment
before insert or update of amount, workplace_id, workplace_name, period_start, period_end
on public.payments
for each row
execute function public.validate_payment_amount();
