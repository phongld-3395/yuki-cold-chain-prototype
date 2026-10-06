-- =====================================================================
-- LAB-2 · Product B · Yuki Cold Logistics – Prototype schema (Supabase / PostgreSQL)
-- Chạy file này trong Supabase Dashboard → SQL Editor (1 lần), sau đó chạy 02_seed.sql.
-- Thiết kế: API route của Next.js gọi DB bằng service role ở phía server;
-- RLS bật trên mọi bảng và KHÔNG có policy cho anon → người lạ không đọc được dữ liệu.
-- =====================================================================

-- ---------- Kiểu liệt kê ----------
create type app_role       as enum ('admin','receiving','warehouse','planner','qa','driver','sales');
create type temp_band      as enum ('AMBIENT','CHILLED','FROZEN');          -- 常温 / 冷蔵 / 冷凍
create type expiry_type    as enum ('BEST_BEFORE','USE_BY');                -- 賞味期限 / 消費期限
create type trace_lane     as enum ('RICE','BEEF','INTERNAL');              -- BR-TRACE-01〜03
create type delivery_term  as enum ('ON_TRUCK','DOORSTEP');                 -- 車上渡し / 軒先渡し
create type window_rule    as enum ('ONE_THIRD','ONE_HALF','LABEL_DATE_ONLY'); -- tập quán thương mại theo hợp đồng
create type lot_status     as enum ('AVAILABLE','QUARANTINE','RELEASED','SCRAPPED');
create type deviation_status as enum ('OPEN','REVIEWED','CLOSED');
create type route_status   as enum ('DRAFT','PUBLISHED');

-- ---------- Người dùng ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  role        app_role not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Master ----------
create table temperature_band_versions (            -- BR-TEMP-01: ngưỡng theo chính sách Yuki, có version
  id             serial primary key,
  band           temp_band not null,
  min_c          numeric(5,1),                       -- null = không giới hạn dưới
  max_c          numeric(5,1),                       -- null = không giới hạn trên
  version        int not null,
  effective_from date not null,
  unique (band, version)
);

create table skus (
  sku_code     text primary key,
  name         text not null,
  band         temp_band not null,
  expiry_type  expiry_type not null,                 -- BR-EXP-01: mỗi SKU đúng 1 loại hạn
  trace_lane   trace_lane not null default 'INTERNAL',
  pack_unit    text not null default 'case',
  is_active    boolean not null default true
);

create table suppliers (
  supplier_code text primary key,
  name          text not null
);

create table customers (
  customer_code text primary key,
  name          text not null,
  delivery_term delivery_term not null,
  email         text
);

create table customer_sku_agreements (               -- R-04: quy tắc delivery window theo từng cặp khách–SKU
  id            serial primary key,
  customer_code text not null references customers(customer_code),
  sku_code      text not null references skus(sku_code),
  window_rule   window_rule,                         -- null = BUSINESS-REVIEW → chặn phân bổ
  note          text,
  unique (customer_code, sku_code)
);

create table locations (
  location_code text primary key,
  band          temp_band not null,
  capacity_cases int not null default 100,
  is_open       boolean not null default true
);

-- ---------- Nhập hàng & tồn kho ----------
create table lots (
  id               bigserial primary key,
  lot_code         text not null unique,
  sku_code         text not null references skus(sku_code),
  supplier_code    text not null references suppliers(supplier_code),
  location_code    text references locations(location_code),
  manufactured_on  date not null,
  expiry_date      date not null,
  expiry_type      expiry_type not null,             -- snapshot từ SKU tại thời điểm nhập
  qty_received     int not null check (qty_received > 0),
  qty_available    int not null check (qty_available >= 0),   -- không cho tồn âm
  measured_temp_c  numeric(5,1) not null,
  band_version_id  int references temperature_band_versions(id),
  beef_id          text check (beef_id is null or beef_id ~ '^[0-9]{10}$'),  -- mã cá thể bò 10 số
  rice_origin      text,
  status           lot_status not null default 'AVAILABLE',
  received_by      uuid references profiles(id),
  received_at      timestamptz not null default now(),
  check (expiry_date > manufactured_on)
);
create index on lots (sku_code, status, expiry_date);

create table deviations (                            -- FR-TEMP-04 / BR-TEMP-02
  id             bigserial primary key,
  lot_id         bigint references lots(id),
  kind           text not null default 'TEMPERATURE',
  measured_c     numeric(5,1),
  band           temp_band,
  band_min_c     numeric(5,1),
  band_max_c     numeric(5,1),
  detected_at    timestamptz not null default now(),
  detected_by    uuid references profiles(id),
  status         deviation_status not null default 'OPEN',
  decision       text check (decision in ('RELEASE','SCRAP')),
  rationale      text,
  reviewed_by    uuid references profiles(id),
  reviewed_at    timestamptz,
  check (status = 'OPEN' or (decision is not null and rationale is not null and length(rationale) >= 5))
);

create table temperature_readings (                  -- dữ liệu logger (mock: seed sẵn, thay cho import CSV)
  id          bigserial primary key,
  device_id   text not null,
  location_code text references locations(location_code),
  recorded_at timestamptz not null,
  temp_c      numeric(5,1) not null,
  source_hash text
);

-- ---------- Xuất hàng ----------
create table sales_orders (
  id             bigserial primary key,
  order_no       text not null unique,
  customer_code  text not null references customers(customer_code),
  requested_date date not null,
  status         text not null default 'OPEN' check (status in ('OPEN','ALLOCATED','SHIPPED','CANCELLED')),
  created_at     timestamptz not null default now()
);

create table order_lines (
  id        bigserial primary key,
  order_id  bigint not null references sales_orders(id) on delete cascade,
  sku_code  text not null references skus(sku_code),
  qty       int not null check (qty > 0),
  status    text not null default 'OPEN' check (status in ('OPEN','ALLOCATED','SHIPPED'))
);

create table allocations (
  id            bigserial primary key,
  order_line_id bigint not null references order_lines(id) on delete cascade,
  lot_id        bigint not null references lots(id),
  qty           int not null check (qty > 0),
  evidence      jsonb not null default '{}',         -- bằng chứng tính: lô bị loại & lý do, window, lịch sử so sánh
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create table deliveries (                            -- lịch sử giao ĐÃ NHẬN → nguồn cho 日付逆転禁止 (DR-HIST-01)
  id            bigserial primary key,
  customer_code text not null references customers(customer_code),
  sku_code      text not null references skus(sku_code),
  lot_id        bigint references lots(id),
  expiry_date   date not null,
  qty           int not null check (qty > 0),
  order_line_id bigint references order_lines(id),
  route_id      bigint,
  status        text not null default 'IN_TRANSIT' check (status in ('IN_TRANSIT','DELIVERED','REJECTED')),
  delivered_at  timestamptz
);
create index on deliveries (customer_code, sku_code, status, delivered_at desc);

create table pods (                                  -- BR-POD-01 (ảnh/chữ ký: mock bằng cờ + ghi chú)
  id            bigserial primary key,
  delivery_id   bigint not null references deliveries(id),
  delivery_term delivery_term not null,
  receiver_name text not null,
  has_signature boolean not null default false,
  has_photo     boolean not null default false,
  arrival_temp_c numeric(5,1),
  note          text,
  recorded_by   uuid references profiles(id),
  recorded_at   timestamptz not null default now()
);

-- ---------- Lập tuyến & giờ lái ----------
create table driver_rule_versions (                  -- FR-SCH-02, tham số hóa theo version (OPS-LAW-01)
  version                    int primary key,
  effective_from             date not null,
  max_continuous_drive_min   int not null,           -- lái liên tục ≤ 4h
  max_daily_restraint_min    int not null,           -- ràng buộc/ngày 13h (ngoại lệ tới 15h)
  max_daily_restraint_ext_min int not null,
  min_rest_between_shifts_min int not null,          -- nghỉ giữa ca ≥ 11h (tối thiểu 9h)
  avg_daily_drive_min        int not null,           -- lái TB 9h/ngày (2 ngày)
  min_break_after_drive_min  int not null,           -- nghỉ ≥ 30 phút sau 4h lái
  note                       text
);

create table routes (
  id             bigserial primary key,
  route_code     text not null unique,
  route_date     date not null,
  driver_name    text not null,
  vehicle_band   temp_band not null,
  depot_start    time not null default '06:00',
  status         route_status not null default 'DRAFT',
  version        int not null default 1,
  rule_version   int references driver_rule_versions(version),
  last_check     jsonb,                              -- kết quả kiểm tra giờ lái lần gần nhất
  change_reason  text,
  published_at   timestamptz,
  published_by   uuid references profiles(id)
);

create table route_stops (
  id              bigserial primary key,
  route_id        bigint not null references routes(id) on delete cascade,
  seq             int not null,
  customer_code   text references customers(customer_code),
  drive_min       int not null check (drive_min >= 0),     -- thời gian lái tới điểm này (mock: nhập tay thay map service)
  service_min     int not null default 20 check (service_min >= 0),
  break_min       int not null default 0 check (break_min >= 0),
  unique (route_id, seq)
);

-- ---------- Audit ----------
create table audit_logs (                            -- NFR-AUD-01: append-only
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  actor_email text,
  action      text not null,
  entity      text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  reason      text,
  created_at  timestamptz not null default now()
);
create or replace function forbid_audit_change() returns trigger language plpgsql as $$
begin raise exception 'audit_logs is append-only'; end $$;
create trigger audit_no_update before update or delete on audit_logs
  for each row execute function forbid_audit_change();

-- ---------- Bảo mật: bật RLS, không tạo policy cho anon/authenticated ----------
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
