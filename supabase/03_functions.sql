-- =====================================================================
-- LAB-2 · Product B · Hàm phân bổ nguyên tử (chạy sau 01 và 02)
-- Khóa dòng đơn và các lô (FOR UPDATE) → 2 người phân bổ cùng lúc không lấy trùng tồn.
-- =====================================================================
create or replace function public.allocate_line(
  p_line_id bigint, p_lot_ids bigint[], p_qtys int[], p_actor uuid, p_evidence jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare i int; v_avail int; v_order bigint;
begin
  perform 1 from order_lines where id = p_line_id and status = 'OPEN' for update;
  if not found then raise exception 'LINE_NOT_OPEN'; end if;
  for i in 1 .. coalesce(array_length(p_lot_ids, 1), 0) loop
    select qty_available into v_avail from lots
      where id = p_lot_ids[i] and status in ('AVAILABLE','RELEASED') for update;
    if v_avail is null or v_avail < p_qtys[i] then
      raise exception 'INSUFFICIENT_STOCK lot %', p_lot_ids[i];
    end if;
    update lots set qty_available = qty_available - p_qtys[i] where id = p_lot_ids[i];
    insert into allocations (order_line_id, lot_id, qty, evidence, created_by)
      values (p_line_id, p_lot_ids[i], p_qtys[i], p_evidence, p_actor);
  end loop;
  update order_lines set status = 'ALLOCATED' where id = p_line_id returning order_id into v_order;
  update sales_orders set status = 'ALLOCATED'
    where id = v_order and not exists (select 1 from order_lines where order_id = v_order and status = 'OPEN');
end $$;

revoke execute on function public.allocate_line(bigint, bigint[], int[], uuid, jsonb) from public, anon, authenticated;
grant execute on function public.allocate_line(bigint, bigint[], int[], uuid, jsonb) to service_role;
