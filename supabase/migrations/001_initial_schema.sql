-- ═══════════════════════════════════════════════════════════════
-- Bite Bhavan POS — Database Schema v1.0
-- Run in: Supabase → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ENUMS
create type user_role      as enum ('owner','counter','kitchen','delivery');
create type order_source   as enum ('direct','zomato','whatsapp');
create type order_status   as enum ('pending','preparing','ready','out_for_delivery','delivered','cancelled');
create type payment_mode   as enum ('cash','upi','card','zomato_pay','online');
create type price_list_t   as enum ('direct','zomato');
create type stock_txn_type as enum ('purchase','order_deduction','manual_adjustment','wastage');

-- USERS
create table users (
  id         uuid primary key default uuid_generate_v4(),
  auth_id    uuid unique references auth.users(id) on delete cascade,
  name       text not null,
  username   text unique not null,
  role       user_role not null default 'counter',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- APP SETTINGS (singleton)
create table app_settings (
  id                    int primary key default 1 check (id=1),
  business_name         text not null default 'Bite Bhavan',
  logo_url              text,
  fssai_number          text,
  gst_number            text,
  contact_phone         text,
  zomato_commission_pct numeric(5,2) not null default 31.00,
  printer_ip            text,
  printer_port          int default 9100,
  currency_symbol       text not null default 'Rs.',
  updated_at            timestamptz not null default now()
);
insert into app_settings (id) values (1);

-- MENU CATEGORIES
create table menu_categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text unique not null,
  sort_order int not null default 0
);
insert into menu_categories (name,slug,sort_order) values
  ('Burgers','burgers',1),('Kheema','kheema',2),
  ('Main Course','mains',3),('Fries','fries',4),
  ('Beverages','beverages',5),('Add-ons','addons',6);

-- MENU ITEMS
create table menu_items (
  id           uuid primary key default uuid_generate_v4(),
  category_id  uuid references menu_categories(id) on delete set null,
  name         text not null,
  emoji        text default 'burger',
  description  text,
  direct_price numeric(10,2) not null,
  zomato_price numeric(10,2) not null,
  is_available boolean not null default true,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
insert into menu_items (name,emoji,category_id,direct_price,zomato_price,sort_order) values
  ('Classic Chicken Burger','burger',(select id from menu_categories where slug='burgers'),120,140,1),
  ('Chicken Double Patty','burger',(select id from menu_categories where slug='burgers'),160,185,2),
  ('Veg Tikki Burger','salad',(select id from menu_categories where slug='burgers'),90,110,3),
  ('Paneer Tikki Burger','cheese',(select id from menu_categories where slug='burgers'),110,130,4),
  ('Spicy Zinger','pepper',(select id from menu_categories where slug='burgers'),140,165,5),
  ('Crispy Chicken Burger','chicken',(select id from menu_categories where slug='burgers'),130,150,6),
  ('Kheema','pot',(select id from menu_categories where slug='kheema'),120,140,1),
  ('Kheema with Pav','pot',(select id from menu_categories where slug='kheema'),130,150,2),
  ('Kheema with Paratha','pot',(select id from menu_categories where slug='kheema'),160,185,3),
  ('Kheema with Chapati','pot',(select id from menu_categories where slug='kheema'),145,170,4),
  ('Chicken Biryani (Full)','bowl',(select id from menu_categories where slug='mains'),1000,1150,1),
  ('Chicken Biryani (Half)','bowl',(select id from menu_categories where slug='mains'),500,575,2),
  ('Chicken Korma + Rice','bowl',(select id from menu_categories where slug='mains'),950,1100,3),
  ('Chicken Korma (no rice)','bowl',(select id from menu_categories where slug='mains'),750,865,4),
  ('Chicken Salan + Rice','bowl',(select id from menu_categories where slug='mains'),850,975,5),
  ('Chicken Salan (no rice)','bowl',(select id from menu_categories where slug='mains'),650,750,6),
  ('Chicken Taheri (Full)','bowl',(select id from menu_categories where slug='mains'),900,1035,7),
  ('Chicken Taheri (Half)','bowl',(select id from menu_categories where slug='mains'),450,520,8),
  ('Chicken Pulav (Full)','bowl',(select id from menu_categories where slug='mains'),900,1035,9),
  ('Chicken Pulav (Half)','bowl',(select id from menu_categories where slug='mains'),450,520,10),
  ('Masala Fries','fries',(select id from menu_categories where slug='fries'),60,75,1),
  ('Peri Peri Fries','fries',(select id from menu_categories where slug='fries'),70,85,2),
  ('Cold Drink (Can)','drink',(select id from menu_categories where slug='beverages'),40,55,1),
  ('Fresh Lime Soda','lemon',(select id from menu_categories where slug='beverages'),60,75,2),
  ('Pav','bread',(select id from menu_categories where slug='addons'),5,10,1),
  ('Paratha','bread',(select id from menu_categories where slug='addons'),20,25,2),
  ('Chapati','bread',(select id from menu_categories where slug='addons'),15,20,3),
  ('Extra Sauce','sauce',(select id from menu_categories where slug='addons'),10,15,4);

-- SAVED ADDRESSES
create table saved_addresses (
  id              uuid primary key default uuid_generate_v4(),
  short_code      text not null unique,
  detail          text,
  phone           text,
  order_count     int not null default 0,
  last_ordered_at timestamptz,
  created_at      timestamptz not null default now()
);

-- ORDERS
create sequence order_number_seq start 1;
create table orders (
  id                 uuid primary key default uuid_generate_v4(),
  order_number       int unique not null default nextval('order_number_seq'),
  source             order_source not null default 'direct',
  status             order_status not null default 'pending',
  price_list         price_list_t not null default 'direct',
  address_short_code text,
  address_note       text,
  customer_phone     text,
  zomato_order_id    text,
  payment_mode       payment_mode not null default 'cash',
  subtotal           numeric(10,2) not null default 0,
  discount           numeric(10,2) not null default 0,
  total              numeric(10,2) not null default 0,
  notes              text,
  created_by         uuid references users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table order_items (
  id             uuid primary key default uuid_generate_v4(),
  order_id       uuid not null references orders(id) on delete cascade,
  menu_item_id   uuid references menu_items(id) on delete set null,
  item_name      text not null,
  item_emoji     text,
  quantity       int not null check (quantity > 0),
  unit_price     numeric(10,2) not null,
  total_price    numeric(10,2) not null,
  note           text,
  created_at     timestamptz not null default now()
);

-- INVENTORY
create table inventory_categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  sort_order int not null default 0
);
insert into inventory_categories (name,sort_order) values
  ('Proteins',1),('Bread',2),('Sauces',3),
  ('Vegetables',4),('Packaging',5),('Custom',6);

create table inventory_items (
  id             uuid primary key default uuid_generate_v4(),
  category_id    uuid references inventory_categories(id),
  name           text not null,
  unit           text not null default 'pcs',
  current_stock  numeric(10,3) not null default 0,
  reorder_level  numeric(10,3) not null default 0,
  cost_per_unit  numeric(10,2) not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
insert into inventory_items (name,unit,current_stock,reorder_level,cost_per_unit,category_id) values
  ('Chicken Tikki','pcs',48,20,18,(select id from inventory_categories where name='Proteins')),
  ('Veg Tikki','pcs',12,15,8,(select id from inventory_categories where name='Proteins')),
  ('Chicken (raw)','kg',3.5,2,220,(select id from inventory_categories where name='Proteins')),
  ('Kheema (raw)','kg',2,1,200,(select id from inventory_categories where name='Proteins')),
  ('Basmati Rice','kg',5,2,80,(select id from inventory_categories where name='Proteins')),
  ('Burger Buns','pcs',60,30,5,(select id from inventory_categories where name='Bread')),
  ('Pav','pcs',40,20,3,(select id from inventory_categories where name='Bread')),
  ('Paratha','pcs',20,10,10,(select id from inventory_categories where name='Bread')),
  ('Mayonnaise','kg',0.8,0.5,160,(select id from inventory_categories where name='Sauces')),
  ('Tomato Sauce','kg',1.2,1,40,(select id from inventory_categories where name='Sauces')),
  ('Onion','kg',3,2,30,(select id from inventory_categories where name='Vegetables')),
  ('Tomato','kg',2,1,40,(select id from inventory_categories where name='Vegetables')),
  ('Burger Box','pcs',75,50,4,(select id from inventory_categories where name='Packaging')),
  ('Carry Bags S','pcs',18,30,2,(select id from inventory_categories where name='Packaging')),
  ('Zomato Tape','rolls',2,3,35,(select id from inventory_categories where name='Packaging')),
  ('Butter Paper','pcs',150,50,1,(select id from inventory_categories where name='Packaging'));

create table recipes (
  id                uuid primary key default uuid_generate_v4(),
  menu_item_id      uuid not null references menu_items(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity_used     numeric(10,4) not null,
  unit              text not null,
  unique(menu_item_id,inventory_item_id)
);

create table stock_transactions (
  id                uuid primary key default uuid_generate_v4(),
  inventory_item_id uuid not null references inventory_items(id),
  type              stock_txn_type not null,
  quantity          numeric(10,3) not null,
  cost_per_unit     numeric(10,2),
  vendor            text,
  order_id          uuid references orders(id),
  notes             text,
  created_by        uuid references users(id),
  created_at        timestamptz not null default now()
);

-- EXPENSES
create table expense_categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  color      text not null default '#b8832a',
  sort_order int not null default 0
);
insert into expense_categories (name,color,sort_order) values
  ('Raw Material','#b8832a',1),('Packaging','#3d6e8f',2),
  ('Utilities','#7a68a0',3),('Staff','#3d8a5e',4),
  ('Rent','#a04845',5),('Marketing','#6b5a8a',6),('Other','#565040',7);

create table expenses (
  id           uuid primary key default uuid_generate_v4(),
  category_id  uuid references expense_categories(id),
  description  text not null,
  vendor       text,
  amount       numeric(10,2) not null,
  payment_mode payment_mode not null default 'cash',
  expense_date date not null default current_date,
  notes        text,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now()
);

-- UPDATED_AT TRIGGER
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end;$$;

create trigger trg_users_upd       before update on users           for each row execute function update_updated_at();
create trigger trg_menu_upd        before update on menu_items      for each row execute function update_updated_at();
create trigger trg_inv_upd         before update on inventory_items for each row execute function update_updated_at();
create trigger trg_orders_upd      before update on orders          for each row execute function update_updated_at();
create trigger trg_settings_upd    before update on app_settings    for each row execute function update_updated_at();

-- AUTO-DEDUCT INVENTORY ON ORDER STATUS CHANGE
create or replace function deduct_inventory_on_order()
returns trigger language plpgsql as $$
declare rec record;
begin
  if (old.status='pending' and new.status in ('preparing','ready')) then
    for rec in
      select oi.quantity, r.inventory_item_id, r.quantity_used
      from order_items oi
      join recipes r on r.menu_item_id=oi.menu_item_id
      where oi.order_id=new.id
    loop
      update inventory_items set current_stock=current_stock-(rec.quantity*rec.quantity_used), updated_at=now()
      where id=rec.inventory_item_id;
      insert into stock_transactions(inventory_item_id,type,quantity,order_id,notes)
      values(rec.inventory_item_id,'order_deduction',-(rec.quantity*rec.quantity_used),new.id,'Auto-deducted BB-'||new.order_number);
    end loop;
  end if;
  return new;
end;$$;
create trigger trg_deduct_inv after update on orders for each row execute function deduct_inventory_on_order();

-- AUTO-UPDATE ADDRESS COUNTER
create or replace function update_address_counter()
returns trigger language plpgsql as $$
begin
  if new.address_short_code is not null then
    insert into saved_addresses(short_code,order_count,last_ordered_at)
    values(new.address_short_code,1,new.created_at)
    on conflict(short_code) do update
      set order_count=saved_addresses.order_count+1, last_ordered_at=new.created_at;
  end if;
  return new;
end;$$;
create trigger trg_addr_counter after insert on orders for each row execute function update_address_counter();

-- ROW LEVEL SECURITY (all authenticated users allowed, role enforced in app)
alter table users enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table menu_items enable row level security;
alter table menu_categories enable row level security;
alter table inventory_items enable row level security;
alter table inventory_categories enable row level security;
alter table recipes enable row level security;
alter table stock_transactions enable row level security;
alter table expenses enable row level security;
alter table expense_categories enable row level security;
alter table saved_addresses enable row level security;
alter table app_settings enable row level security;

create policy "auth_all" on users              for all to authenticated using (true) with check (true);
create policy "auth_all" on orders             for all to authenticated using (true) with check (true);
create policy "auth_all" on order_items        for all to authenticated using (true) with check (true);
create policy "auth_all" on menu_items         for all to authenticated using (true) with check (true);
create policy "auth_all" on menu_categories    for all to authenticated using (true) with check (true);
create policy "auth_all" on inventory_items    for all to authenticated using (true) with check (true);
create policy "auth_all" on inventory_categories for all to authenticated using (true) with check (true);
create policy "auth_all" on recipes            for all to authenticated using (true) with check (true);
create policy "auth_all" on stock_transactions for all to authenticated using (true) with check (true);
create policy "auth_all" on expenses           for all to authenticated using (true) with check (true);
create policy "auth_all" on expense_categories for all to authenticated using (true) with check (true);
create policy "auth_all" on saved_addresses    for all to authenticated using (true) with check (true);
create policy "auth_all" on app_settings       for all to authenticated using (true) with check (true);
