'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  CalendarDays,
  CreditCard,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Phone,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  ButtonLink,
  Container,
  LoadingSpinner,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
} from '@e-pharmacy/ui/common';

import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { ROUTES } from '@/lib/routes';

import {
  formatCapitalizedLabel,
  formatOrderDateTime,
  formatPrice,
} from '@e-pharmacy/utils/formatters';

import { buildProductPath, buildPharmacyPath } from '@/lib/routes';
import { getOrderIdFromPathParam } from '@/lib/routes';
import { useAuth } from '@e-pharmacy/auth/core';
import { getOrderDetails } from '@/lib/api/browser';
import type { BreadcrumbItem, Order } from '@e-pharmacy/types';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

type OrderDetailsPageContentProps = {
  orderId: string;
};

//===================================================================

function formatPaymentMethod(method: Order['paymentMethod']): string {
  return method === 'bank_transfer'
    ? 'Bank transfer'
    : 'Cash on pickup / delivery';
}

function formatDeliveryMethod(method: Order['delivery']['method']): string {
  return method === 'postal_delivery'
    ? 'Postal delivery'
    : 'Pickup from pharmacy';
}

//===================================================================

function OrderDetailsPageContent({ orderId }: OrderDetailsPageContentProps) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');
  const cleanOrderId = getOrderIdFromPathParam(orderId);

  useEffect(() => {
    let isMounted = true;

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
        const response = await getOrderDetails(cleanOrderId);

        if (!isMounted) return;

        setOrder(response.order);
      } catch {
        if (!isMounted) return;

        setOrder(null);
        setError('Order was not found or is not available for this account.');
      } finally {
        if (!isMounted) return;

        setIsLoaded(true);
      }
    }

    void fetchOrder();

    return () => {
      isMounted = false;
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

              <ButtonLink href={ROUTES.PROFILE}>Back to profile</ButtonLink>
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

            <span className={css.statusBadge}>
              {formatCapitalizedLabel(order.status)}
            </span>
          </div>

          <div className={css.orderShell}>
            <div className={css.orderMain}>
              <article className={css.order} aria-labelledby="order-title">
                <div className={css.pharmacyHead}>
                  <div>
                    <p className={css.kicker}>Pharmacy order</p>
                    <h2 className={css.pharmacyTitle} id="order-title">
                      {order.pharmacyName}
                    </h2>

                    <RatingSummary
                      rating={order.pharmacyRating}
                      reviewsCount={order.pharmacyReviewsCount ?? 0}
                      size="sm"
                    />
                  </div>

                  <ButtonLink
                    className={css.pharmacyDetailsLink}
                    href={pharmacyHref}
                    variant="secondary"
                    size="sm"
                  >
                    Pharmacy details
                  </ButtonLink>
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
                            <h3 className={css.itemTitle}>{item.name}</h3>
                          </div>
                          <p className={css.itemPrice}>
                            {formatPrice(item.totalPrice)}
                          </p>
                        </div>

                        <div className={css.itemFooter}>
                          <p className={css.quantityText}>
                            Purchased quantity: <strong>{item.quantity}</strong>
                          </p>

                          <ButtonLink
                            className={css.productDetailsLink}
                            href={buildProductPath(item.name, item.productId)}
                            variant="secondary"
                            size="sm"
                          >
                            Product details
                          </ButtonLink>
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
                  <dd>{formatOrderDateTime(order.createdAt)}</dd>
                </div>
                <div>
                  <dt>
                    <CreditCard size={16} aria-hidden="true" /> Payment method
                  </dt>
                  <dd>{formatPaymentMethod(order.paymentMethod)}</dd>
                </div>
                <div>
                  <dt>
                    <Truck size={16} aria-hidden="true" /> Delivery method
                  </dt>
                  <dd>{formatDeliveryMethod(order.delivery.method)}</dd>
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
                  <dt>Total</dt>
                  <dd>{formatPrice(order.totalPrice)}</dd>
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
