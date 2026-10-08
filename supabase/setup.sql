-- Execute UMA VEZ no SQL Editor de um projeto Supabase vazio.
-- Depois crie o usuário em Authentication > Users e execute o grant-admin.sql.
begin;
create table public.shops (id uuid primary key, name text not null);
create table public.shop_admins (shop_id uuid not null references public.shops(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,primary key(shop_id,user_id));
create index shop_admins_user_idx on public.shop_admins(user_id);
create table public.shop_state (shop_id uuid primary key references public.shops(id),data jsonb not null default '{}'::jsonb check(jsonb_typeof(data)='object'),revision bigint not null default 0,updated_at timestamptz not null default now());
create table public.shop_history (id bigint generated always as identity primary key,shop_id uuid not null references public.shops(id),revision bigint not null,actor text not null,actions jsonb not null,created_at timestamptz not null default now());
create index shop_history_shop_date on public.shop_history(shop_id,created_at desc);
create table public.checkout_limits (shop_id uuid not null references public.shops(id),bucket timestamptz not null,requests integer not null default 0,primary key(shop_id,bucket));
-- RLS em TODAS as tabelas públicas; nenhum usuário Auth pode se tornar admin.
alter table public.shops enable row level security;
alter table public.shop_admins enable row level security;
alter table public.shop_state enable row level security;
alter table public.shop_history enable row level security;
alter table public.checkout_limits enable row level security;
create policy own_membership on public.shop_admins for select to authenticated using(user_id=(select auth.uid()));
create policy admin_shops on public.shops for select to authenticated using(exists(select 1 from public.shop_admins a where a.shop_id=shops.id and a.user_id=(select auth.uid())));
create policy admin_state on public.shop_state for select to authenticated using(exists(select 1 from public.shop_admins a where a.shop_id=shop_state.shop_id and a.user_id=(select auth.uid())));
create policy admin_history on public.shop_history for select to authenticated using(exists(select 1 from public.shop_admins a where a.shop_id=shop_history.shop_id and a.user_id=(select auth.uid())));
revoke all on public.shops,public.shop_admins,public.shop_state,public.shop_history,public.checkout_limits from anon,authenticated;
grant select on public.shops,public.shop_admins,public.shop_state,public.shop_history to authenticated;
grant all on public.shops,public.shop_admins,public.shop_state,public.shop_history,public.checkout_limits to service_role;
grant usage,select on all sequences in schema public to service_role;
-- CAS: reserva lock, confere versão e salva todos os efeitos da operação numa transação.
create function public.commit_shop_state(p_shop_id uuid,p_expected_revision bigint,p_data jsonb,p_actor text) returns boolean language plpgsql security invoker set search_path='' as $$
declare old_data jsonb; current_revision bigint;
begin
 select data,revision into old_data,current_revision from public.shop_state where shop_id=p_shop_id for update;
 if not found then raise exception 'Loja inexistente'; end if;
 if current_revision<>p_expected_revision then return false; end if;
 if jsonb_typeof(p_data)<>'object' or not (p_data ?& array['materials','parts','products','orders','audit']) then raise exception 'Estado inválido'; end if;
 update public.shop_state set data=p_data,revision=revision+1,updated_at=now() where shop_id=p_shop_id;
 insert into public.shop_history(shop_id,revision,actor,actions) values(p_shop_id,current_revision+1,p_actor,coalesce((select jsonb_agg(value) from jsonb_array_elements(p_data->'audit') value where not exists(select 1 from jsonb_array_elements(coalesce(old_data->'audit','[]'::jsonb)) old where old->>'id'=value->>'id')),'[]'::jsonb));
 return true;
end $$;
revoke all on function public.commit_shop_state(uuid,bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.commit_shop_state(uuid,bigint,jsonb,text) to service_role;
-- Limite persistente global por loja (evita depender de memória serverless).
create function public.allow_checkout(p_shop_id uuid,p_limit integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare count_now integer; hour_now timestamptz:=date_trunc('hour',now());
begin
 if p_limit<1 or p_limit>10000 then raise exception 'Limite inválido'; end if;
 insert into public.checkout_limits(shop_id,bucket,requests) values(p_shop_id,hour_now,1) on conflict(shop_id,bucket) do update set requests=public.checkout_limits.requests+1 returning requests into count_now;
 delete from public.checkout_limits where shop_id=p_shop_id and bucket<now()-interval '48 hours';
 return count_now<=p_limit;
end $$;
revoke all on function public.allow_checkout(uuid,integer) from public,anon,authenticated;
grant execute on function public.allow_checkout(uuid,integer) to service_role;
insert into public.shops values('00000000-0000-4000-8000-000000000001','Bicou Brincou');
insert into public.shop_state(shop_id) values('00000000-0000-4000-8000-000000000001');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('products','products',true,4000000,array['image/png','image/jpeg','image/webp']);
create policy admin_upload on storage.objects for insert to authenticated with check(bucket_id='products' and exists(select 1 from public.shop_admins a where a.user_id=(select auth.uid()) and a.shop_id::text=(storage.foldername(name))[1]));
create policy admin_image_select on storage.objects for select to authenticated using(bucket_id='products' and exists(select 1 from public.shop_admins a where a.user_id=(select auth.uid()) and a.shop_id::text=(storage.foldername(name))[1]));
create policy admin_image_update on storage.objects for update to authenticated using(bucket_id='products' and exists(select 1 from public.shop_admins a where a.user_id=(select auth.uid()) and a.shop_id::text=(storage.foldername(name))[1])) with check(bucket_id='products' and exists(select 1 from public.shop_admins a where a.user_id=(select auth.uid()) and a.shop_id::text=(storage.foldername(name))[1]));
create policy admin_image_delete on storage.objects for delete to authenticated using(bucket_id='products' and exists(select 1 from public.shop_admins a where a.user_id=(select auth.uid()) and a.shop_id::text=(storage.foldername(name))[1]));
commit;
