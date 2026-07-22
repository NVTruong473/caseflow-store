-- NOTIFY-T09: allow deliberate order cleanup without deleting the customer's
-- notification history. The event keeps its order code in minimized metadata.

begin;

alter table public.notification_outbox
  drop constraint if exists notification_outbox_order_id_fkey;

alter table public.notification_outbox
  add constraint notification_outbox_order_id_fkey
  foreign key (order_id)
  references public.orders(id)
  on update cascade
  on delete set null;

alter table public.customer_notifications
  drop constraint if exists customer_notifications_order_id_fkey;

alter table public.customer_notifications
  add constraint customer_notifications_order_id_fkey
  foreign key (order_id)
  references public.orders(id)
  on update cascade
  on delete set null;

commit;
