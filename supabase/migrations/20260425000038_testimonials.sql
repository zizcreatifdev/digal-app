-- Testimonials table for landing page
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  texte       text not null,
  nom         text not null,
  fonction    text not null default '',
  photo_url   text,
  ordre       integer not null default 0,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.testimonials enable row level security;

-- Public can read active testimonials
create policy "testimonials_public_select"
  on public.testimonials for select
  using (actif = true);

-- Admin full access
create policy "testimonials_admin_all"
  on public.testimonials for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage bucket for testimonial photos
insert into storage.buckets (id, name, public)
values ('testimonials', 'testimonials', true)
on conflict (id) do nothing;

create policy "testimonials_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'testimonials');

create policy "testimonials_photos_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'testimonials'
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "testimonials_photos_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'testimonials'
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
