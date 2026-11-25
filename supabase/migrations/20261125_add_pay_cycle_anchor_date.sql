alter table public.workplaces
  add column if not exists pay_cycle_anchor_date date;

comment on column public.workplaces.pay_cycle_anchor_date is
  'First day of a known 14-day bi-weekly pay period; used to generate payment periods automatically.';
