// Ma trận quyền màn hình theo vai trò. admin thấy tất cả.
export const ROLE_LABEL = {
  admin: 'Quản trị', receiving: 'Nhập hàng', warehouse: 'Kho', planner: 'Lập kế hoạch',
  qa: 'QA', driver: 'Tài xế', sales: 'Kinh doanh',
};

export const NAV = [
  { group: 'Tổng quan', items: [
    { href: '/', label: 'Bảng điều khiển', roles: ['*'] },
  ]},
  { group: 'Nhập & kho', items: [
    { href: '/inbound', label: 'Kiểm hàng nhập', roles: ['receiving', 'warehouse'] },
    { href: '/lots', label: 'Tồn kho theo lô', roles: ['receiving', 'warehouse', 'planner', 'qa', 'sales'] },
  ]},
  { group: 'Xuất & giao', items: [
    { href: '/orders', label: 'Đơn hàng & phân bổ', roles: ['planner', 'sales', 'warehouse'] },
    { href: '/shipments', label: 'Xuất hàng', roles: ['warehouse', 'planner'] },
    { href: '/routes', label: 'Lập tuyến & giờ lái', roles: ['planner'] },
    { href: '/pod', label: 'Xác nhận giao (POD)', roles: ['driver', 'planner'] },
  ]},
  { group: 'Chất lượng', items: [
    { href: '/deviations', label: 'Cảnh báo nhiệt độ', roles: ['qa', 'receiving', 'warehouse'] },
    { href: '/readings', label: 'Nhật ký logger', roles: ['qa', 'receiving'] },
    { href: '/trace', label: 'Truy xuất nguồn gốc', roles: ['qa', 'planner', 'sales', 'receiving'] },
  ]},
  { group: 'Quản trị', items: [
    { href: '/master', label: 'SKU & hợp đồng khách', roles: ['sales', 'planner', 'qa'] },
    { href: '/users', label: 'Người dùng & vai trò', roles: [] },
    { href: '/audit', label: 'Nhật ký thao tác', roles: ['qa'] },
  ]},
];

export function canSee(role, roles) {
  return role === 'admin' || roles.includes('*') || roles.includes(role);
}
