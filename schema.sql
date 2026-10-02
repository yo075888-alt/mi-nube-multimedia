-- Ejecuta este SQL en Supabase > SQL Editor.
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.folders enable row level security;
create policy "Users manage own folders" on public.folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id,name,public) values ('media','media',false) on conflict (id) do nothing;
create policy "Users upload own media" on storage.objects for insert to authenticated with check (bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users read own media" on storage.objects for select to authenticated using (bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users update own media" on storage.objects for update to authenticated using (bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users delete own media" on storage.objects for delete to authenticated using (bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text);
