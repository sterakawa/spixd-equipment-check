-- Browser access needed by the public checklist app.
-- Run once in the Supabase SQL Editor after 001_initial_schema.sql.

grant usage on schema public to anon;
grant select on public.equipment_categories, public.equipment_items to anon;
grant select, insert on public.plans, public.plan_items to anon;

create policy "public can read enabled equipment categories"
on public.equipment_categories for select to anon
using (enabled = true);

create policy "public can read enabled equipment items"
on public.equipment_items for select to anon
using (enabled = true);

create policy "public can create plans"
on public.plans for insert to anon
with check (status in ('draft', 'issued'));

create policy "public can open plans by public id"
on public.plans for select to anon
using (true);

create policy "public can add plan items"
on public.plan_items for insert to anon
with check (true);

create policy "public can read plan items"
on public.plan_items for select to anon
using (true);
