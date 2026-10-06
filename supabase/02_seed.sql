-- =====================================================================
-- LAB-2 · Product B · Dữ liệu MOCK (không phải dữ liệu nghiệp vụ thật)
-- Ngày tham chiếu của bộ dữ liệu: 2026-10-05 (JST). Chạy sau 01_schema.sql.
-- Tài khoản demo (auth.users + profiles) được tạo bằng script scripts/seed-users.mjs.
-- =====================================================================

insert into temperature_band_versions (band,min_c,max_c,version,effective_from) values
 ('AMBIENT', 15, 25, 1, '2026-04-01'),   -- chính sách Yuki, không phải chuẩn quốc gia
 ('CHILLED',  0,  5, 1, '2026-04-01'),
 ('FROZEN', null,-18, 1, '2026-04-01');

insert into skus (sku_code,name,band,expiry_type,trace_lane,pack_unit) values
 ('CHI-001','Đậu phụ lụa (絹豆腐)','CHILLED','USE_BY','INTERNAL','case'),
 ('CHI-002','Sữa tươi 1L (牛乳)','CHILLED','BEST_BEFORE','INTERNAL','case'),
 ('CHI-003','Thịt bò thái lát (牛肉スライス)','CHILLED','USE_BY','BEEF','case'),
 ('CHI-004','Cơm nắm onigiri (おにぎり)','CHILLED','USE_BY','RICE','case'),
 ('AMB-001','Gạo Koshihikari 5kg (米)','AMBIENT','BEST_BEFORE','RICE','bag'),
 ('AMB-002','Nước tương 1L (醤油)','AMBIENT','BEST_BEFORE','INTERNAL','case'),
 ('FRO-001','Gà rán đông lạnh (冷凍唐揚げ)','FROZEN','BEST_BEFORE','INTERNAL','case'),
 ('FRO-002','Kem vani (アイスクリーム)','FROZEN','BEST_BEFORE','INTERNAL','case');

insert into suppliers values
 ('SUP-01','Sakuragi Dairy'),('SUP-02','Minato Tofu'),('SUP-03','Hokkai Beef'),('SUP-04','Niigata Rice'),('SUP-05','Kanto Frozen Foods');

insert into customers values
 ('CUS-001','Siêu thị Hanamaru – Sakuragi','DOORSTEP','cus001@example.test'),
 ('CUS-002','Nhà hàng Umi – Minato','ON_TRUCK','cus002@example.test'),
 ('CUS-003','Yuki-mart cửa hàng số 3','DOORSTEP','cus003@example.test'),
 ('CUS-004','Yuki-mart cửa hàng số 4','ON_TRUCK','cus004@example.test'),
 ('CUS-005','Bếp trường học Aoba','DOORSTEP','cus005@example.test');

insert into customer_sku_agreements (customer_code,sku_code,window_rule,note) values
 ('CUS-003','CHI-002','ONE_THIRD','Theo hợp đồng chuỗi bán lẻ'),
 ('CUS-004','CHI-002','ONE_HALF',null),
 ('CUS-001','CHI-002','LABEL_DATE_ONLY','Chỉ cần còn hạn in trên nhãn'),
 ('CUS-005','CHI-002',null,'BUSINESS-REVIEW: chưa chốt quy tắc'),
 ('CUS-003','CHI-001','LABEL_DATE_ONLY',null),
 ('CUS-002','FRO-001','ONE_HALF',null),
 ('CUS-001','CHI-003','LABEL_DATE_ONLY',null),
 ('CUS-002','AMB-001','ONE_THIRD',null);

insert into locations values
 ('A-01','AMBIENT',200,true),('C-01','CHILLED',120,true),('C-02','CHILLED',120,true),
 ('F-01','FROZEN',150,true),('Q-01','CHILLED',40,true);

-- Lô tồn kho (band_version_id = 2 là CHILLED v1, 1 AMBIENT, 3 FROZEN)
insert into lots (lot_code,sku_code,supplier_code,location_code,manufactured_on,expiry_date,expiry_type,qty_received,qty_available,measured_temp_c,band_version_id,beef_id,rice_origin,status,received_at) values
 ('L-CHI002-A','CHI-002','SUP-01','C-01','2026-09-25','2026-10-09','BEST_BEFORE',40,40,3.2,2,null,null,'AVAILABLE','2026-09-26 05:10+09'),
 ('L-CHI002-B','CHI-002','SUP-01','C-01','2026-10-01','2026-10-15','BEST_BEFORE',40,40,3.0,2,null,null,'AVAILABLE','2026-10-02 05:05+09'),
 ('L-CHI002-C','CHI-002','SUP-01','C-02','2026-10-04','2026-10-18','BEST_BEFORE',60,60,2.8,2,null,null,'AVAILABLE','2026-10-05 05:00+09'),
 ('L-CHI002-D','CHI-002','SUP-01','Q-01','2026-10-04','2026-10-18','BEST_BEFORE',20,20,6.2,2,null,null,'QUARANTINE','2026-10-05 05:20+09'),
 ('L-CHI001-A','CHI-001','SUP-02','C-01','2026-09-30','2026-10-05','USE_BY',30,12,2.5,2,null,null,'AVAILABLE','2026-10-01 05:30+09'),
 ('L-CHI001-B','CHI-001','SUP-02','C-01','2026-10-04','2026-10-10','USE_BY',30,30,2.1,2,null,null,'AVAILABLE','2026-10-05 05:30+09'),
 ('L-CHI003-A','CHI-003','SUP-03','C-02','2026-10-03','2026-10-08','USE_BY',15,15,1.8,2,'1234567890',null,'AVAILABLE','2026-10-04 05:40+09'),
 ('L-CHI004-A','CHI-004','SUP-04','C-02','2026-10-05','2026-10-06','USE_BY',50,50,3.5,2,null,'Niigata','AVAILABLE','2026-10-05 04:50+09'),
 ('L-AMB001-A','AMB-001','SUP-04','A-01','2026-09-01','2027-03-01','BEST_BEFORE',80,80,20.0,1,null,'Niigata','AVAILABLE','2026-09-03 09:00+09'),
 ('L-FRO001-A','FRO-001','SUP-05','F-01','2026-06-01','2027-06-01','BEST_BEFORE',100,100,-20.5,3,null,null,'AVAILABLE','2026-06-05 10:00+09'),
 ('L-FRO001-B','FRO-001','SUP-05','F-01','2026-08-15','2027-08-15','BEST_BEFORE',100,100,-21.0,3,null,null,'AVAILABLE','2026-08-20 10:00+09'),
 ('L-FRO002-A','FRO-002','SUP-05','F-01','2026-07-01','2028-07-01','BEST_BEFORE',60,60,-22.0,3,null,null,'AVAILABLE','2026-07-05 10:00+09');

insert into deviations (lot_id,kind,measured_c,band,band_min_c,band_max_c,detected_at,status)
select id,'TEMPERATURE',6.2,'CHILLED',0,5,'2026-10-05 05:20+09','OPEN' from lots where lot_code='L-CHI002-D';

-- Lịch sử giao đã nhận (nguồn so sánh 日付逆転禁止 theo từng cặp khách–SKU)
insert into deliveries (customer_code,sku_code,lot_id,expiry_date,qty,status,delivered_at) values
 ('CUS-003','CHI-002',null,'2026-10-14',20,'DELIVERED','2026-10-03 08:30+09'),
 ('CUS-003','CHI-002',null,'2026-10-16',20,'DELIVERED','2026-10-04 08:20+09'),  -- lần gần nhất: hạn 10/16
 ('CUS-003','CHI-001',null,'2026-10-08',10,'DELIVERED','2026-10-03 08:30+09'),
 ('CUS-002','FRO-001',null,'2027-07-01',30,'DELIVERED','2026-09-28 10:00+09'),  -- lô 2027-06-01 sẽ bị chặn
 ('CUS-001','CHI-002',null,'2026-10-12',15,'REJECTED','2026-10-04 09:00+09');   -- bị từ chối → không tính là đã nhận

insert into sales_orders (order_no,customer_code,requested_date,status) values
 ('SO-1001','CUS-003','2026-10-06','OPEN'),
 ('SO-1002','CUS-004','2026-10-06','OPEN'),
 ('SO-1003','CUS-005','2026-10-06','OPEN'),
 ('SO-1004','CUS-003','2026-10-06','OPEN'),
 ('SO-1005','CUS-002','2026-10-06','OPEN'),
 ('SO-1006','CUS-001','2026-10-06','OPEN');

insert into order_lines (order_id,sku_code,qty)
select o.id,x.sku,x.qty from (values
 ('SO-1001','CHI-002',20),('SO-1002','CHI-002',20),('SO-1003','CHI-002',10),
 ('SO-1004','CHI-001',10),('SO-1005','FRO-001',30),('SO-1006','CHI-003',5)) as x(no,sku,qty)
join sales_orders o on o.order_no=x.no;

insert into temperature_readings (device_id,location_code,recorded_at,temp_c,source_hash) values
 ('LOG-C01','C-01','2026-10-05 03:00+09',3.1,'seed'),('LOG-C01','C-01','2026-10-05 03:15+09',3.4,'seed'),
 ('LOG-C01','C-01','2026-10-05 03:30+09',5.8,'seed'),('LOG-C01','C-01','2026-10-05 03:45+09',4.2,'seed'),
 ('LOG-F01','F-01','2026-10-05 03:00+09',-20.1,'seed'),('LOG-F01','F-01','2026-10-05 03:15+09',-19.8,'seed');

insert into driver_rule_versions values
 (1,'2024-04-01',240,780,900,660,540,30,'Tóm tắt 改善基準告示 2024 theo RFP – cần tái kiểm chứng pháp lý (OPS-LAW-01)');

insert into routes (route_code,route_date,driver_name,vehicle_band,depot_start,status,rule_version) values
 ('R-20261006-01','2026-10-06','Tanaka','CHILLED','05:30','DRAFT',1),
 ('R-20261006-02','2026-10-06','Suzuki','FROZEN','06:00','DRAFT',1);

insert into route_stops (route_id,seq,customer_code,drive_min,service_min,break_min)
select r.id,x.seq,x.cus,x.d,x.s,x.b from (values
 ('R-20261006-01',1,'CUS-003',90,20,0),('R-20261006-01',2,'CUS-004',100,20,0),('R-20261006-01',3,'CUS-001',70,20,0),
 ('R-20261006-02',1,'CUS-002',60,25,0),('R-20261006-02',2,'CUS-005',80,20,30),('R-20261006-02',3,'CUS-001',50,20,0)
) as x(code,seq,cus,d,s,b) join routes r on r.route_code=x.code;
