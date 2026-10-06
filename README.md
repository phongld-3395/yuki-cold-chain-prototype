# Yuki Cold Chain – Prototype LAB-2 (Product B)

Prototype hệ thống quản lý chuỗi kho lạnh 3 dải nhiệt cho Công ty CP Logistics Lạnh Yuki (đề giả lập, khóa AIDD for PL).
Stack: **Next.js 14 (App Router + API route) · Supabase (Postgres + Auth) · Vercel**.

| Mục | Link |
|---|---|
| App (Vercel) | `https://yuki-cold-chain-prototype.vercel.app` |
| Project Supabase | `https://supabase.com/dashboard/project/dymozbaynldidxbylduo` |
| Danh sách màn hình bản chốt & phần mock | `https://docs.google.com/spreadsheets/d/1GwkegxSMYvumPhq3uvYhggTXUt2fLrm9PaEaqt0Mnac/edit` |

> **Không vào được app / báo lỗi kết nối cơ sở dữ liệu?** Project Supabase gói Free tự tạm dừng khi lâu không dùng.
> Vào Supabase Dashboard → mở project → bấm **Resume project**, chờ 1–2 phút rồi tải lại trang.

## Tài khoản demo

Mật khẩu chung: `YukiDemo2026!` (dữ liệu mock, giữ nguyên tới hết LAB-6)

| Email | Vai trò | Dùng để demo |
|---|---|---|
| admin.yuki@example.com | Quản trị | Thấy toàn bộ màn hình |
| receiving.yuki@example.com | Nhập hàng | Kiểm hàng nhập, tồn kho |
| planner.yuki@example.com | Lập kế hoạch | Đơn hàng, phân bổ, xuất hàng, lập tuyến |
| qa.yuki@example.com | QA | Cảnh báo nhiệt độ, logger, truy xuất, audit |
| driver.yuki@example.com | Tài xế | Xác nhận giao (POD) |

## Kịch bản demo nhanh (dữ liệu mock quanh ngày nghiệp vụ 2026-10-06)

1. **Phân bổ & 日付逆転** – Đơn hàng → `SO-1001` (CUS-003, sữa CHI-002): lô hạn 10/09 và 10/15 bị loại vì cũ hơn lô khách đã nhận (10/16); lô 10/18 đang cách ly bị loại; hệ thống chọn lô 10/18 còn lại.
2. **Không mượn lịch sử khách khác** – `SO-1002` (CUS-004, cùng SKU, chưa có lịch sử) → FEFO chọn lô 10/15.
3. **消費期限 chặn cứng** – `SO-1004` (đậu phụ): lô hết hạn 10/05 bị chặn.
4. **BUSINESS-REVIEW** – `SO-1003` (CUS-005): hợp đồng chưa chốt quy tắc delivery window → không phân bổ được. Sửa ở *SKU & hợp đồng khách* rồi thử lại.
5. **Kiểm hàng nhập** – nhập SKU CHI-002 với nhiệt độ 6.2°C → lô vào cách ly, tạo cảnh báo; đăng nhập QA để release/scrap kèm lý do.
6. **Giờ lái 2024** – Lập tuyến → `R-20261006-01`: lái liên tục 260 phút (10:10–10:30 vượt 4h) → không publish được; thêm 30 phút nghỉ sau điểm 2 → publish được.
7. **POD** – Xuất hàng → POD: khách 軒先渡し thiếu ảnh → không hoàn tất. Lần giao đã nhận trở thành mốc 日付逆転 cho đơn sau.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev                  # mở http://localhost:3000
npm test                     # test luật phân bổ & giờ lái
```

## Dựng database (1 lần)

Supabase → SQL Editor, chạy lần lượt: `supabase/01_schema.sql` → `supabase/02_seed.sql` → `supabase/03_functions.sql`.
Tạo 5 tài khoản demo trong Authentication → Users (tích *Auto Confirm User*), rồi chạy đoạn gán vai trò trong `supabase/04_demo_users.sql`.

## Kiến trúc

- **Frontend**: các trang trong `app/(app)/*` (client component) gọi API route bằng `fetch`.
- **Backend**: `app/api/**/route.js` – kiểm tra đăng nhập + vai trò (`lib/auth.js`), đọc/ghi Supabase bằng service role ở server.
- **Bảo mật**: `middleware.js` chặn mọi trang/API khi chưa đăng nhập; RLS bật trên mọi bảng, không mở cho anon; bảng `audit_logs` chặn sửa/xóa bằng trigger.
- **Luật nghiệp vụ** (thuần, có test): `lib/rules/allocation.mjs` (消費期限, dải nhiệt, cách ly, delivery window, 日付逆転, FEFO/FIFO), `lib/rules/driving.mjs` (giờ lái).
- **Phân bổ nguyên tử**: hàm Postgres `allocate_line` khóa dòng đơn và lô (`FOR UPDATE`).
- **Ngày nghiệp vụ demo**: `NEXT_PUBLIC_DEMO_DATE` (mặc định 2026-10-06); phân bổ so theo *ngày giao dự kiến của đơn*, nên demo không bị “hết hạn” theo thời gian thật.

## Phần mock (chi tiết trong Google Sheet danh sách màn hình)

| Phần mock | Nếu làm thật cần |
|---|---|
| Đăng nhập email/mật khẩu (không SSO, không MFA) | IdP doanh nghiệp (OIDC), MFA cho vai trò đặc quyền |
| Ảnh kiểm hàng / ảnh & chữ ký POD là ô đánh dấu | Supabase Storage + hash ảnh, thiết bị tài xế |
| Dữ liệu logger đổ sẵn | Import CSV logger idempotent theo hash |
| Thời gian lái nhập tay, kiểm 2 giới hạn trong ngày | Map service có license; giới hạn tuần/tháng/năm từ chấm công |
| Không gửi email cảnh báo | Mail relay doanh nghiệp, nhắc lại khi quá SLA 15 phút |
| Đơn hàng tạo tay | Tích hợp ERP qua CSV/SFTP |
| POD không có chế độ offline | Hàng đợi offline mã hóa tối đa 8 giờ |
| Master sửa trực tiếp (không maker-checker) | Vòng đời đề xuất → duyệt → hiệu lực theo ngày |
