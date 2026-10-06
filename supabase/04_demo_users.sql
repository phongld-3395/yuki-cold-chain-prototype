-- Chạy SAU KHI đã tạo 5 tài khoản trong Authentication → Users (tích Auto Confirm User)
update auth.users set email_confirmed_at = now()
where email like '%.yuki@example.com' and email_confirmed_at is null;

insert into public.profiles (id, email, full_name, role)
select u.id, u.email, v.full_name, v.role::app_role
from auth.users u
join (values
 ('admin.yuki@example.com','Quản trị (demo)','admin'),
 ('receiving.yuki@example.com','Nhân viên nhập hàng (demo)','receiving'),
 ('planner.yuki@example.com','Người lập kế hoạch (demo)','planner'),
 ('qa.yuki@example.com','QA (demo)','qa'),
 ('driver.yuki@example.com','Tài xế (demo)','driver')
) as v(email, full_name, role) on v.email = u.email
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

select email, full_name, role from public.profiles order by email;
