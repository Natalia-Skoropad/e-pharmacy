import type { OrderMenuCounts } from '@/lib/orders/order-counter-state';

//===================================================================

const MAX_VISIBLE_ORDER_COUNT = 999;

//===================================================================

export function hasOrderNotifications(counts: OrderMenuCounts): boolean {
  return counts.new > 0 || counts.inProgress > 0;
}

//===================================================================

export function formatVisibleOrderCount(count: number): string {
  return count > MAX_VISIBLE_ORDER_COUNT
    ? `${MAX_VISIBLE_ORDER_COUNT}+`
    : String(count);
}

//===================================================================

export function getOrderCountAriaLabel(
  count: number,
  kind: 'new' | 'in_progress'
): string {
  if (kind === 'new') {
    return `${count} new ${count === 1 ? 'order' : 'orders'}`;
  }

  return `${count} ${count === 1 ? 'order' : 'orders'} in progress`;
}

//===================================================================

export function getCollapsedOrderNotificationLabel(
  counts: OrderMenuCounts
): string {
  const labels: string[] = [];

  if (counts.new > 0) {
    labels.push(getOrderCountAriaLabel(counts.new, 'new'));
  }

  if (counts.inProgress > 0) {
    labels.push(getOrderCountAriaLabel(counts.inProgress, 'in_progress'));
  }

  return `Order notifications: ${labels.join(', ')}`;
}
