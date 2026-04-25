-- Config éditable pour la section témoignages
create table if not exists public.testimonials_config (
  id   text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.testimonials_config enable row level security;

create policy "testimonials_config_public_select"
  on public.testimonials_config for select
  using (true);

create policy "testimonials_config_admin_all"
  on public.testimonials_config for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Valeurs par défaut
insert into public.testimonials_config (id, data) values
  ('section', '{"badge":"Témoignages","titre":"Ils font confiance à Digal","sous_titre":"Des community managers et agences au Sénégal qui ont transformé leur activité."}'::jsonb),
  ('stats', '[{"valeur":"500+","libelle":"Community Managers actifs"},{"valeur":"3h","libelle":"Économisées par jour en moyenne"},{"valeur":"98%","libelle":"Taux de satisfaction client"},{"valeur":"2×","libelle":"Plus de clients fidélisés"}]'::jsonb)
on conflict (id) do nothing;
