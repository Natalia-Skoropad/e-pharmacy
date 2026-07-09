'use client';

import Link from 'next/link';
import { CalendarDays, CreditCard, MapPin, Package, Phone, ShoppingBag, Truck, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  ButtonLink,
  LoadingSpinner,
  RatingSummary,
  ShimmerImage,
} from '@e-pharmacy/ui/common';

import { ConfirmationModal } from '@e-pharmacy/ui/modals';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import type { OrderStatus } from '@e-pharmacy/types';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  getPharmacyOrderDetails,
  getPharmacyOrders,
  updatePharmacyOrderStatus,
} from '@/lib/api/browser';

import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type PharmacyOrderDetails,
  type PharmacyOrderItem,
} from '@/lib/orders/orders';

import {
  getPharmacyClientPath,
  getPharmacyOrderPath,
  getPharmacyOrdersPath,
  getPharmacyProductPath,
} from '@/lib/layout/routes';

import { getProductImageSrc } from '@/lib/products/product-images';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

type OrderDetailsPageContentProps = Readonly<{
  orderId: string;
}>;

type PendingStatusChange = Readonly<{
  status: Extract<OrderStatus, 'in_progress' | 'successful' | 'rejected'>;
  rejectionReason?: string;
}>;

//===================================================================

function formatOrderDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return formatShortDate(value);

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

//===================================================================

function getNextStatuses(status: OrderStatus) {
  if (status === 'new') return ['in_progress'] as const;
  if (status === 'in_progress') return ['successful', 'rejected'] as const;

  return [] as const;
}

//===================================================================

function getStatusActionLabel(status: PendingStatusChange['status']) {
  if (status === 'in_progress') return 'Accept order';
  if (status === 'successful') return 'Complete order';

  return 'Reject order';
}

//===================================================================

function getStatusModalText(status: PendingStatusChange['status']) {
  if (status === 'in_progress') {
    return {
      title: 'Accept order?',
      description:
        'This action will move the order to processing. Reserved products will stay reserved for this order.',
    };
  }

  if (status === 'successful') {
    return {
      title: 'Complete order?',
      description:
        'This action will mark the order as completed and permanently write off the reserved products from stock. This status change cannot be reverted.',
    };
  }

  return {
    title: 'Reject order?',
    description:
      'This action will reject the order and return reserved products to available stock. This status change cannot be reverted.',
  };
}

//===================================================================

function OrderProductCard({ item }: Readonly<{ item: PharmacyOrderItem }>) {
  const imageSrc = getProductImageSrc(item.imageUrl);

  return (
    <article className={css.itemCard}>
      <div className={css.itemImageWrap}>
        {imageSrc ? (
          <ShimmerImage
            className={css.itemImage}
            src={imageSrc}
            alt={item.name}
            sizes="120px"
            unoptimized
          />
        ) : (
          <span className={css.itemFallback}>{item.name.charAt(0)}</span>
        )}
      </div>

      <div className={css.itemBody}>
        {item.category ? (
          <p className={css.itemCategory}>{PRODUCT_CATEGORY_LABELS[item.category]}</p>
        ) : null}

        <h3 className={css.itemTitle}>{item.name}</h3>

        <RatingSummary
          className={css.itemRating}
          rating={item.rating ?? 0}
          reviewsCount={item.reviewsCount ?? 0}
        />

        <dl className={css.itemMeta}>
          <div>
            <dt>Article</dt>
            <dd>{item.article}</dd>
          </div>
          <div>
            <dt>Reserved quantity</dt>
            <dd>{item.quantity}</dd>
          </div>
          <div>
            <dt>Fixed unit price</dt>
            <dd>{formatPrice(item.unitPrice)}</dd>
          </div>
        </dl>
      </div>

      <div className={css.itemAside}>
        <p className={css.itemAmount}>{formatPrice(item.totalPrice)}</p>
        <ButtonLink
          href={getPharmacyProductPath(item.productId)}
          variant="secondary"
          size="sm"
          renderLink={({ href, className, children, ...props }) => (
            <Link href={href} className={className} {...props}>
              {children}
            </Link>
          )}
        >
          Product details
        </ButtonLink>
      </div>
    </article>
  );
}

//===================================================================

function OrderDetailsPageContent({ orderId }: OrderDetailsPageContentProps) {
  const toast = useToast();
  const [order, setOrder] = useState<PharmacyOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PendingStatusChange | null>(
    null
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError(null);

      try {
        let loadedOrder: PharmacyOrderDetails;

        try {
          loadedOrder = await getPharmacyOrderDetails(orderId);
        } catch (detailsError) {
          if (!/^\d+$/.test(orderId)) throw detailsError;

          const ordersResponse = await getPharmacyOrders({ page: 1, perPage: 1 });
          const fallbackOrder = ordersResponse.items[0];

          if (!fallbackOrder) throw detailsError;

          loadedOrder = await getPharmacyOrderDetails(fallbackOrder.id);
        }

        if (isMounted) setOrder(loadedOrder);
      } catch {
        if (isMounted) {
          setOrder(null);
          setError('Could not load the order. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const nextStatuses = useMemo(
    () => (order ? getNextStatuses(order.status) : []),
    [order]
  );

  const statusModalText = pendingStatus
    ? getStatusModalText(pendingStatus.status)
    : null;

  const handleStatusClick = (
    status: Extract<OrderStatus, 'in_progress' | 'successful' | 'rejected'>
  ) => {
    if (status === 'rejected') {
      const rejectionReason = window.prompt('Explain why this order is rejected.');

      if (!rejectionReason?.trim()) return;

      setPendingStatus({ status, rejectionReason: rejectionReason.trim() });
      return;
    }

    setPendingStatus({ status });
  };

  const handleConfirmStatus = async () => {
    if (!order || !pendingStatus) return;

    setIsUpdatingStatus(true);

    try {
      const updatedOrder = await updatePharmacyOrderStatus(order.id, pendingStatus);

      setOrder(updatedOrder);
      setPendingStatus(null);
      toast.success('Order status updated successfully.');
    } catch (statusError) {
      toast.error(
        statusError instanceof Error && statusError.message
          ? statusError.message
          : 'Could not update order status.'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <main className={css.page} aria-label="Loading order">
        <section className={css.contentCard}>
          <LoadingSpinner label="Loading order..." />
        </section>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className={css.page} aria-labelledby="order-details-page-title">
        <section className={css.contentCard}>
          <PageHeader
            title="Order not found"
            titleId="order-details-page-title"
            icon={<ShoppingBag size={23} aria-hidden="true" />}
          />
          <p className={css.errorText}>{error ?? 'Order not found.'}</p>
          <ButtonLink
            href={getPharmacyOrdersPath()}
            renderLink={({ href, className, children, ...props }) => (
              <Link href={href} className={className} {...props}>
                {children}
              </Link>
            )}
          >
            Back to orders
          </ButtonLink>
        </section>
      </main>
    );
  }

  return (
    <main className={css.page} aria-labelledby="order-details-page-title">
      <section className={css.contentCard}>
        <div className={css.headerGrid}>
          <div className={css.titleBlock}>
            <PageHeader
              title={`Order ${order.orderNumber}`}
              titleId="order-details-page-title"
              icon={<ShoppingBag size={23} aria-hidden="true" />}
            />
            <p className={css.metaText}>Created on {formatOrderDate(order.orderDate)}</p>
          </div>

          <div className={css.statusActions}>
            <StatusBadge
              status={order.status}
              label={ORDER_STATUS_LABELS[order.status as OrderStatus]}
            />

            {nextStatuses.map((status: PendingStatusChange['status']) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={status === 'rejected' ? 'secondary' : 'primary'}
                className={status === 'rejected' ? css.rejectButton : undefined}
                onClick={() => handleStatusClick(status)}
              >
                {getStatusActionLabel(status)}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className={css.contentCard}>
        <div className={css.orderGrid}>
          <section className={css.itemsSection} aria-labelledby="order-items-title">
            <div className={css.sectionHeader}>
              <h2 id="order-items-title">Order products</h2>
              <p>{order.totalQuantity} reserved items</p>
            </div>

            <div className={css.itemsList}>
              {order.items.map((item: PharmacyOrderItem) => (
                <OrderProductCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <aside className={css.summaryCard} aria-labelledby="order-summary-title">
            <h2 id="order-summary-title">Order details</h2>

            <dl className={css.summaryList}>
              <div>
                <dt>
                  <CalendarDays size={16} aria-hidden="true" /> Date
                </dt>
                <dd>{formatOrderDate(order.orderDate)}</dd>
              </div>
              <div>
                <dt>
                  <CreditCard size={16} aria-hidden="true" /> Payment method
                </dt>
                <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}</dd>
              </div>
              <div>
                <dt>
                  <Truck size={16} aria-hidden="true" /> Delivery method
                </dt>
                <dd>{DELIVERY_METHOD_LABELS[order.deliveryMethod as keyof typeof DELIVERY_METHOD_LABELS]}</dd>
              </div>
              <div>
                <dt>
                  <UserRound size={16} aria-hidden="true" /> Client
                </dt>
                <dd>
                  {order.clientId ? (
                    <Link href={getPharmacyClientPath(order.clientId)}>
                      {order.client}
                    </Link>
                  ) : (
                    order.client
                  )}
                </dd>
              </div>
              {order.recipientPhone ? (
                <div>
                  <dt>
                    <Phone size={16} aria-hidden="true" /> Recipient phone
                  </dt>
                  <dd>{order.recipientPhone}</dd>
                </div>
              ) : null}
              {order.deliveryAddress ? (
                <div>
                  <dt>
                    <MapPin size={16} aria-hidden="true" /> Delivery address
                  </dt>
                  <dd>{order.deliveryAddress}</dd>
                </div>
              ) : null}
              <div>
                <dt>
                  <Package size={16} aria-hidden="true" /> Items
                </dt>
                <dd>{order.totalQuantity}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatPrice(order.totalAmount)}</dd>
              </div>
            </dl>

            <div className={css.commentBox}>
              <h3>Client comment</h3>
              <p>{order.clientComment || 'Client did not leave a comment.'}</p>
            </div>

            <ButtonLink
              className={css.backButton}
              href={getPharmacyOrdersPath()}
              variant="secondary"
              renderLink={({ href, className, children, ...props }) => (
                <Link href={href} className={className} {...props}>
                  {children}
                </Link>
              )}
            >
              Back to orders
            </ButtonLink>
          </aside>
        </div>
      </section>

      <ConfirmationModal
        isOpen={Boolean(pendingStatus)}
        title={statusModalText?.title ?? 'Update order status?'}
        description={statusModalText?.description ?? ''}
        confirmLabel={pendingStatus ? getStatusActionLabel(pendingStatus.status) : 'Confirm'}
        isLoading={isUpdatingStatus}
        onConfirm={() => void handleConfirmStatus()}
        onCancel={() => {
          if (!isUpdatingStatus) setPendingStatus(null);
        }}
      />
    </main>
  );
}

export default OrderDetailsPageContent;
export { OrderDetailsPageContent };
