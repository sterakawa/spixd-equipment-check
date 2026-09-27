-- SPIXD Equipment Check initial schema
-- Run this file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table public.equipment_categories (
  id text primary key,
  name text not null,
  description text,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment_items (
  id text primary key,
  category_id text not null references public.equipment_categories(id),
  name text not null,
  note text,
  icon text not null default 'plus',
  default_quantity integer not null default 1 check (default_quantity > 0),
  default_selected boolean not null default false,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default encode(gen_random_bytes(6), 'hex'),
  event_name text not null,
  event_date date not null,
  status text not null default 'draft'
    check (status in ('draft','issued','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  equipment_id text references public.equipment_items(id) on delete set null,
  category_id text,
  category_name text not null,
  item_name text not null,
  note text,
  icon text not null default 'plus',
  quantity integer not null default 1 check (quantity > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.check_results (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  checked_by text not null,
  results jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);

create index plans_public_id_idx on public.plans(public_id);
create index plans_event_date_idx on public.plans(event_date);
create index plan_items_plan_id_idx on public.plan_items(plan_id);
create index check_results_plan_id_idx on public.check_results(plan_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger equipment_categories_updated_at
before update on public.equipment_categories
for each row execute function public.set_updated_at();

create trigger equipment_items_updated_at
before update on public.equipment_items
for each row execute function public.set_updated_at();

create trigger plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

alter table public.equipment_categories enable row level security;
alter table public.equipment_items enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.check_results enable row level security;

-- No anonymous policies are created.
-- The browser must not receive the service-role key.
-- Vercel server functions will access these tables using server-side credentials.

insert into public.equipment_categories (id,name,description,sort_order) values
  ('spixd','SPIXD運用機材','SPIXDの配布運用に必要な機材',10),
  ('shooting','撮影機材','カメラ・照明などの撮影用機材',20),
  ('booth','ブース設営機材','背景・椅子・養生などの設営機材',30),
  ('print','写真プリント機材','写真出力に使用する機材',40),
  ('network','通信機材','会場回線・ルーター・Starlink関連',50),
  ('power','電源機材','電源・延長・充電関連',60);

insert into public.equipment_items
  (id,category_id,name,note,icon,default_quantity,default_selected,sort_order)
values
  ('spixd-pc','spixd','SPIXDノートPC','本体を2台確認','laptop',2,true,10),
  ('pc-ac','power','PC用ACアダプター','PC本体とは別に確認','power',2,true,20),
  ('receipt-printer','spixd','レシートプリンター','本体を2台確認','receipt-printer',2,true,30),
  ('printer-ac','power','レシートプリンター ACアダプター','プリンター本体とは別に確認','power',2,true,40),
  ('pocket-wifi','network','ポケットWi-Fi','本体・充電状態を確認','router',2,true,50),
  ('printer-usb','spixd','プリンター USBケーブル','プリンター接続用','usb',1,true,60),
  ('camera-usb','shooting','カメラ USBケーブル','テザー撮影用','usb',1,true,70),
  ('ac-power','power','AC電源コンセント','延長・電源タップ類','power',1,true,80),
  ('wifi-router','network','Wi-Fiルーター','電源・設定を確認','router',1,true,90),
  ('receipt-roll','spixd','予備レシート','ロール紙の残量も確認','roll',1,true,100),
  ('mouse-set','spixd','マウスセット','マウス・予備電池','mouse',1,true,110),
  ('qr-reader','spixd','QRリーダー','必要な案件のみ','qr-reader',1,false,120),
  ('starlink','network','Starlink','会場回線がない場合','starlink',1,false,130),
  ('lan-45m','network','45m LANケーブル','Starlink離隔設置用','long-lan',1,false,140),
  ('cable-ramp','booth','ケーブル保護モール','通路を横切る場合','cable-ramp',1,false,150),
  ('stool','booth','丸椅子','オペレーター用','stool',1,false,160),
  ('usb-booster','shooting','長距離USB・ブースター','撮影距離が5mを超える場合','booster',1,false,170),
  ('signage','booth','サイネージPC・モニター','写真表示案件','monitor',1,false,180),
  ('photo-printer','print','写真用プリンター','写真プリント案件','photo-printer',1,false,190),
  ('backup-pc','spixd','予備PC','長時間・重要案件','laptop',1,false,200);
