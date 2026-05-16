'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CreditCard, PackageCheck, Truck } from 'lucide-react';

import {
  ButtonLink,
  Container,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
} from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

import { ROUTES } from '@/lib/constants/routes';
import {
  getCustomerOrder,
  getOrderIdFromPathParam,
  type CustomerOrder,
} from '@/lib/orders';

import type { BreadcrumbItem } from '@/types';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

type OrderDetailsPageContentProps = {
  orderId: string;
};

//===================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(price);
}

//===================================================================

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

//===================================================================

function formatPaymentMethod(method: CustomerOrder['paymentMethod']): string {
  return method === 'bank-transfer'
    ? 'Bank transfer'
    : 'Cash on pickup / delivery';
}

//===================================================================

function formatDeliveryMethod(method: CustomerOrder['deliveryMethod']): string {
  return method === 'post' ? 'Post delivery' : 'Pickup from pharmacy';
}

//===================================================================

function formatStatus(status: CustomerOrder['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

//===================================================================

function OrderDetailsPageContent({ orderId }: OrderDetailsPageContentProps) {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const cleanOrderId = getOrderIdFromPathParam(orderId);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrder(getCustomerOrder(cleanOrderId));
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [cleanOrderId]);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { label: 'Home', href: ROUTES.HOME },
      { label: 'Profile', href: ROUTES.PROFILE },
      { label: order?.orderNumber ?? 'Order details' },
    ],
    [order]
  );

  if (!isLoaded) {
    return (
      <main className={css.page}>
        <section className={css.section} aria-labelledby="order-title">
          <Container>
            <Breadcrumbs items={breadcrumbs} />
            <div className={css.statusCard}>Loading order details...</div>
          </Container>
        </section>
      </main>
    );
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
                This private order is not available in the current browser
                storage.
              </p>
              <ButtonLink href={ROUTES.PROFILE}>Back to profile</ButtonLink>
            </div>
          </Container>
        </section>
      </main>
    );
  }

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
                Review the confirmed pharmacy invoice and order details.
              </p>
            </div>

            <span className={css.statusBadge}>
              {formatStatus(order.status)}
            </span>
          </div>

          <div className={css.orderShell}>
            <div className={css.orderMain}>
              <article className={css.invoice} aria-labelledby="invoice-title">
                <div className={css.storeHead}>
                  <div>
                    <p className={css.kicker}>Pharmacy invoice</p>
                    <h2 className={css.storeTitle} id="invoice-title">
                      {order.storeName}
                    </h2>
                    <RatingSummary
                      rating={order.storeRating}
                      reviewsCount={order.storeReviewsCount ?? 0}
                      size="sm"
                    />
                  </div>
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
                            <RatingSummary
                              rating={item.rating}
                              reviewsCount={item.reviewsCount ?? 0}
                              size="sm"
                            />
                          </div>
                          <p className={css.itemPrice}>
                            {formatPrice(item.totalPrice)}
                          </p>
                        </div>

                        <p className={css.quantityText}>
                          Purchased quantity: <strong>{item.quantity}</strong>
                        </p>
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
                  <dd>{formatDate(order.createdAt)}</dd>
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
                  <dd>{formatDeliveryMethod(order.deliveryMethod)}</dd>
                </div>

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
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default OrderDetailsPageContent;
