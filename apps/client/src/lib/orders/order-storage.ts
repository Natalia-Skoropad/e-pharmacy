import type { Cart, CartItem, Store } from '@/types';

//===================================================================

export type CustomerOrderStatus = 'accepted' | 'processing' | 'completed';
export type CustomerOrderPaymentMethod = 'cash' | 'bank-transfer';
export type CustomerOrderDeliveryMethod = 'pickup' | 'post';

export type CustomerOrderItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  quantity: number;
  price: number;
  totalPrice: number;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  storeId: string;
  storeName: string;
  storeRating?: number;
  storeReviewsCount?: number;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  totalItems: number;
  totalPrice: number;
  status: CustomerOrderStatus;
  paymentMethod: CustomerOrderPaymentMethod;
  deliveryMethod: CustomerOrderDeliveryMethod;
  comment?: string;
  bankDetails?: Store['bankDetails'];
  items: CustomerOrderItem[];
};

export type CustomerOrderDraft = {
  storeId: string;
  storeName: string;
  store?: Store | null;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
  paymentMethod: CustomerOrderPaymentMethod;
  deliveryMethod: CustomerOrderDeliveryMethod;
  comment?: string;
};

//===================================================================

const CUSTOMER_ORDERS_STORAGE_KEY = 'e-pharmacy.customer-orders';

//===================================================================

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

//===================================================================

function createOrderId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

//===================================================================

function createOrderNumber(): string {
  const date = new Date();
  const datePart = new Intl.DateTimeFormat('uk-UA', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll('.', '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `EP-${datePart}-${randomPart}`;
}

//===================================================================

function getStoreAddress(store?: Store | null): string | undefined {
  if (!store) return undefined;

  return [store.address, store.city].filter(Boolean).join(', ');
}

//===================================================================

function mapOrderItem(item: CartItem): CustomerOrderItem {
  return {
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    imageUrl: item.product.imageUrl,
    rating: item.product.rating,
    reviewsCount: item.product.reviewsCount,
    quantity: item.quantity,
    price: item.price,
    totalPrice: item.totalPrice,
  };
}

//===================================================================

export function getCustomerOrders(): CustomerOrder[] {
  if (!canUseStorage()) return [];

  try {
    const value = window.localStorage.getItem(CUSTOMER_ORDERS_STORAGE_KEY);
    if (!value) return [];

    const orders = JSON.parse(value) as CustomerOrder[];

    if (!Array.isArray(orders)) return [];

    return orders;
  } catch {
    return [];
  }
}

//===================================================================

export function getCustomerOrder(orderId: string): CustomerOrder | null {
  return getCustomerOrders().find((order) => order.id === orderId) ?? null;
}

//===================================================================

export function saveCustomerOrder(draft: CustomerOrderDraft): CustomerOrder {
  const order: CustomerOrder = {
    id: createOrderId(),
    orderNumber: createOrderNumber(),
    createdAt: new Date().toISOString(),
    storeId: draft.storeId,
    storeName: draft.storeName,
    storeRating: draft.items[0]?.storeRating,
    storeReviewsCount: draft.items[0]?.storeReviewsCount,
    storePhone: draft.store?.phone,
    storeEmail: draft.store?.email,
    storeAddress: getStoreAddress(draft.store),
    totalItems: draft.totalItems,
    totalPrice: draft.totalPrice,
    status: 'accepted',
    paymentMethod: draft.paymentMethod,
    deliveryMethod: draft.deliveryMethod,
    comment: draft.comment?.trim() || undefined,
    bankDetails: draft.store?.bankDetails,
    items: draft.items.map(mapOrderItem),
  };
  const orders = [order, ...getCustomerOrders()];

  if (canUseStorage()) {
    window.localStorage.setItem(
      CUSTOMER_ORDERS_STORAGE_KEY,
      JSON.stringify(orders)
    );
  }

  return order;
}

//===================================================================

export function buildCustomerOrderPath(order: Pick<CustomerOrder, 'id' | 'orderNumber'>): string {
  const safeNumber = order.orderNumber.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return `/profile/orders/${safeNumber}--${order.id}`;
}

//===================================================================

export function getOrderIdFromPathParam(orderId: string): string {
  return orderId.split('--').at(-1) ?? orderId;
}
