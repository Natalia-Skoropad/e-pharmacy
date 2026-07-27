'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  CalendarDays,
  CreditCard,
  CircleDollarSign,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Phone,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from '@e-pharmacy/config/presentation';

import { LoadingSpinner, SvgIcon } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { useAuth } from '@e-pharmacy/auth/core';
import type { ClientOrder } from '@e-pharmacy/types/orders';
import type { BreadcrumbItem } from '@e-pharmacy/ui/navigation';
import { formatDateTime } from '@e-pharmacy/utils/date';
import { formatMoney } from '@e-pharmacy/utils/money';

import {
  ROUTES,
  buildProductPath,
  buildPharmacyPath,
  getOrderIdFromPathParam,
} from '@/lib/routes';

import { getOrderDetails } from '@/lib/api/browser';

import { StatusBadge } from '@e-pharmacy/ui/statistics';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

type OrderDetailsPageContentProps = {
  orderId: string;
};

//===================================================================

function OrderDetailsPageContent({ orderId }: OrderDetailsPageContentProps) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');
  const cleanOrderId = getOrderIdFromPathParam(orderId);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrder() {
      if (!isAuthReady) return;

      if (!isAuthenticated) {
        setOrder(null);
        setIsLoaded(true);
        return;
      }

      try {
        setIsLoaded(false);
        setError('');
        const response = await getOrderDetails(cleanOrderId, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) setOrder(response.order);
      } catch {
        if (controller.signal.aborted) return;

        setOrder(null);
        setError('Order was not found or is not available for this account.');
      } finally {
        if (!controller.signal.aborted) setIsLoaded(true);
      }
    }

    void fetchOrder();

    return () => {
      controller.abort();
    };
  }, [cleanOrderId, isAuthenticated, isAuthReady]);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { label: 'Home', href: ROUTES.HOME },
      { label: 'Profile', href: ROUTES.PROFILE },
      { label: order?.orderNumber ?? 'Order details' },
    ],
    [order]
  );

  if (!isLoaded) {
    return <LoadingSpinner label="Loading order details..." />;
  }

  if (!order) {
    return (
      <main className={css.page}>
        <section className={css.section} aria-labelledby="order-title">
          <Container>
            <Breadcrumbs items={breadcrumbs} />

            <div className={css.emptyCard}>
              <h1 className={css.title} id="order-title">
                Order was not found
              </h1>
              <p className={css.text}>
                {error ||
                  'This private order is not available for this account.'}
              </p>

              <LinkButton href={ROUTES.PROFILE}>Back to profile</LinkButton>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  const pharmacyHref = buildPharmacyPath(order.pharmacyName, order.pharmacyId);
  const hasDeliveryDetails =
    order.delivery.method === 'postal_delivery' &&
    Boolean(order.delivery.details);

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="order-title">
        <Container>
          <Breadcrumbs items={breadcrumbs} />

          <div className={css.hero}>
            <div>
              <h1 className={css.title} id="order-title">
                Order {order.orderNumber}
              </h1>
              <p className={css.text}>
                Review the confirmed pharmacy order and order details.
              </p>
            </div>

            <StatusBadge {...ORDER_STATUS_PRESENTATION[order.status]} />
          </div>

          {order.status === 'rejected' && order.rejectionReason ? (
            <section
              className={css.rejectionCard}
              aria-labelledby="order-rejection-title"
            >
              <MessageSquareText size={20} aria-hidden="true" />
              <div>
                <h2 id="order-rejection-title">Rejection reason</h2>
                <p>{order.rejectionReason}</p>
              </div>
            </section>
          ) : null}

          <div className={css.orderShell}>
            <div className={css.orderMain}>
              <article className={css.order} aria-labelledby="order-title">
                <div className={css.pharmacyHead}>
                  <div>
                    <p className={css.kicker}>Pharmacy order</p>
                    <h2 className={css.pharmacyTitle}>{order.pharmacyName}</h2>

                    <RatingSummary
                      rating={order.pharmacyRating}
                      reviewsCount={order.pharmacyReviewsCount ?? 0}
                      size="sm"
                    />
                  </div>

                  <LinkButton
                    className={css.pharmacyDetailsLink}
                    href={pharmacyHref}
                    variant="secondary"
                    size="sm"
                  >
                    Pharmacy details
                  </LinkButton>
                </div>

                <ul className={css.itemList}>
                  {order.items.map((item) => (
                    <li className={css.itemCard} key={item.id}>
                      <div className={css.imageWrap}>
                        {item.imageUrl ? (
                          <ShimmerImage
                            className={css.image}
                            src={item.imageUrl}
                            alt={item.name}
                            sizes="(max-width: 767px) 120px, 140px"
                          />
                        ) : (
                          <div className={css.imageFallback} aria-hidden="true">
                            <SvgIcon name="icon-shopping-cart" size={28} />
                          </div>
                        )}
                      </div>

                      <div className={css.itemContent}>
                        <div className={css.itemHead}>
                          <div>
                            {item.category ? (
                              <p className={css.itemCategory}>
                                {PRODUCT_CATEGORY_LABELS[item.category]}
                              </p>
                            ) : null}

                            <h3 className={css.itemTitle}>{item.name}</h3>

                            <RatingSummary
                              rating={item.rating ?? 0}
                              reviewsCount={item.reviewsCount ?? 0}
                              size="sm"
                            />
                          </div>
                          <dl className={css.itemPrices}>
                            <div className={css.totalPriceRow}>
                              <dt>Total amount</dt>
                              <dd>{formatMoney(item.totalPrice) ?? '—'}</dd>
                            </div>
                            <div className={css.unitPriceRow}>
                              <dt>Unit price</dt>
                              <dd>{formatMoney(item.unitPrice) ?? '—'}</dd>
                            </div>
                          </dl>
                        </div>

                        <div className={css.itemFooter}>
                          <p className={css.quantityText}>
                            Purchased quantity: <strong>{item.quantity}</strong>
                          </p>

                          <LinkButton
                            className={css.productDetailsLink}
                            href={buildProductPath(item.name, item.productId)}
                            variant="secondary"
                            size="sm"
                          >
                            Product details
                          </LinkButton>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <aside className={css.summary} aria-labelledby="summary-title">
              <h2 className={css.summaryTitle} id="summary-title">
                Order details
              </h2>

              <dl className={css.detailsList}>
                <div>
                  <dt>
                    <CalendarDays size={16} aria-hidden="true" /> Date
                  </dt>
                  <dd>{formatDateTime(order.createdAt) ?? '—'}</dd>
                </div>
                <div>
                  <dt>
                    <CreditCard size={16} aria-hidden="true" /> Payment method
                  </dt>
                  <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
                </div>
                <div>
                  <dt>
                    <Truck size={16} aria-hidden="true" /> Delivery method
                  </dt>
                  <dd>{DELIVERY_METHOD_LABELS[order.delivery.method]}</dd>
                </div>

                {hasDeliveryDetails && order.delivery.details?.recipientName ? (
                  <div>
                    <dt>
                      <UserRound size={16} aria-hidden="true" /> Recipient
                    </dt>
                    <dd>{order.delivery.details.recipientName}</dd>
                  </div>
                ) : null}

                {hasDeliveryDetails &&
                order.delivery.details?.recipientPhone ? (
                  <div>
                    <dt>
                      <Phone size={16} aria-hidden="true" /> Recipient phone
                    </dt>
                    <dd>{order.delivery.details.recipientPhone}</dd>
                  </div>
                ) : null}

                {hasDeliveryDetails && order.delivery.details?.address ? (
                  <div>
                    <dt>
                      <MapPin size={16} aria-hidden="true" /> Delivery address
                    </dt>
                    <dd>{order.delivery.details.address}</dd>
                  </div>
                ) : null}

                <div>
                  <dt>
                    <PackageCheck size={16} aria-hidden="true" /> Items
                  </dt>
                  <dd>{order.totalItems}</dd>
                </div>
                <div>
                  <dt>
                    <CircleDollarSign size={16} aria-hidden="true" /> Total
                  </dt>
                  <dd>{formatMoney(order.totalPrice) ?? '—'}</dd>
                </div>
              </dl>

              {order.comment ? (
                <div className={css.commentCard}>
                  <h3 className={css.commentTitle}>
                    <MessageSquareText size={16} aria-hidden="true" /> Order
                    comment
                  </h3>
                  <p className={css.commentText}>{order.comment}</p>
                </div>
              ) : null}
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default OrderDetailsPageContent;
