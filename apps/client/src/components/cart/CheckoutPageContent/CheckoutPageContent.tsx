'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  Button,
  ButtonLink,
  Container,
  LoadingSpinner,
} from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/components/providers';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';

import { getCart, removeCartItem } from '@/services';

import type { Cart } from '@/types';

import css from './CheckoutPageContent.module.css';

//===================================================================

type PaymentMethod = 'cash' | 'bank-transfer';
type DeliveryMethod = 'pickup' | 'post';

type StoreOrderGroup = {
  storeId: string;
  storeName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

//===================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(price);
}

function groupCartByStore(cart: Cart): StoreOrderGroup[] {
  const groups = new Map<string, StoreOrderGroup>();

  for (const item of cart.items) {
    const storeName = item.storeName || item.product.storeName || 'Pharmacy';
    const group = groups.get(item.storeId);

    if (group) {
      group.items.push(item);
      group.totalItems += item.quantity;
      group.totalPrice += item.totalPrice;
      continue;
    }

    groups.set(item.storeId, {
      storeId: item.storeId,
      storeName,
      items: [item],
      totalItems: item.quantity,
      totalPrice: item.totalPrice,
    });
  }

  return [...groups.values()];
}

//===================================================================

function CheckoutPageContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const checkoutStoreId = searchParams.get('storeId');

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderGroups = useMemo(() => groupCartByStore(cart), [cart]);
  const selectedOrderGroup = useMemo(() => {
    if (orderGroups.length === 0) return null;

    return (
      orderGroups.find((group) => group.storeId === checkoutStoreId) ??
      orderGroups[0]
    );
  }, [checkoutStoreId, orderGroups]);

  const isPostDeliveryValid =
    deliveryMethod === 'pickup' ||
    (recipientName.trim().length >= 2 &&
      recipientPhone.trim().length >= 6 &&
      deliveryAddress.trim().length >= 8);

  const canSubmit =
    Boolean(selectedOrderGroup) && isPostDeliveryValid && !isSubmitting;

  useEffect(() => {
    let isMounted = true;

    async function fetchCart() {
      if (!token) return;

      try {
        const response = await getCart(token);

        if (!isMounted) return;

        setCart(response.cart);
        setError('');
      } catch {
        if (!isMounted) return;

        setError('Could not load checkout data.');
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    }

    void fetchCart();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (!selectedOrderGroup) return;

      let nextCart = cart;

      for (const item of selectedOrderGroup.items) {
        const response = await removeCartItem(item.id, token);
        nextCart = response.cart;
      }

      setCart(nextCart);
      setSuccessMessage(
        `Invoice from ${selectedOrderGroup.storeName} accepted with status “Accepted”.`
      );
    } catch {
      setError('Could not confirm order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="checkout-title">
        <Container>
          <Breadcrumbs items={createBreadcrumbs(CHECKOUT_TITLE)} />

          <div className={css.hero}>
            <h1 className={css.title} id="checkout-title">
              {CHECKOUT_TITLE}
            </h1>
            <p className={css.text}>{CHECKOUT_DESCRIPTION}</p>
          </div>

          {isLoading ? (
            <div className={css.status}>
              <LoadingSpinner label="Loading checkout invoice..." />
            </div>
          ) : null}

          {error ? (
            <div className={css.notice} role="alert">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className={css.success} role="status">
              <h2 className={css.successTitle}>{successMessage}</h2>
              <p className={css.successText}>
                Later this order should be visible in the customer profile and
                in the matching pharmacy cabinet. Tiny paperwork goblin: paused
                until the real backend order endpoint is connected.
              </p>
              <div className={css.successActions}>
                <ButtonLink href={ROUTES.CART} variant="secondary">
                  Back to cart
                </ButtonLink>

                <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
                  Back to catalog
                </ButtonLink>
              </div>
            </div>
          ) : null}

          {!isLoading && !successMessage && cart.items.length === 0 ? (
            <div className={css.empty}>
              <h2 className={css.emptyTitle}>Your cart is empty</h2>
              <p className={css.emptyText}>
                Add medicines first, then checkout will form pharmacy invoices.
              </p>
              <div className={css.successActions}>
                <ButtonLink href={ROUTES.CART} variant="secondary">
                  Back to cart
                </ButtonLink>

                <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
                  Browse medicines
                </ButtonLink>
              </div>
            </div>
          ) : null}

          {!successMessage && selectedOrderGroup ? (
            <div className={css.grid}>
              <div className={css.leftColumn}>
                <section className={css.card} aria-labelledby="delivery-title">
                  <h2 className={css.cardTitle} id="delivery-title">
                    Delivery method
                  </h2>

                  <div className={css.optionsGrid}>
                    <label className={css.optionCard}>
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === 'pickup'}
                        onChange={() => setDeliveryMethod('pickup')}
                      />
                      <span>Pickup from pharmacy</span>
                    </label>

                    <label className={css.optionCard}>
                      <input
                        type="radio"
                        name="delivery"
                        value="post"
                        checked={deliveryMethod === 'post'}
                        onChange={() => setDeliveryMethod('post')}
                      />
                      <span>Post delivery</span>
                    </label>
                  </div>

                  {deliveryMethod === 'post' ? (
                    <div className={css.fieldsGrid}>
                      <label className={css.field}>
                        <span>Recipient name</span>
                        <input
                          value={recipientName}
                          maxLength={80}
                          onChange={(event) =>
                            setRecipientName(event.target.value)
                          }
                        />
                      </label>

                      <label className={css.field}>
                        <span>Recipient phone</span>
                        <input
                          value={recipientPhone}
                          maxLength={32}
                          onChange={(event) =>
                            setRecipientPhone(event.target.value)
                          }
                        />
                      </label>

                      <label className={css.fieldWide}>
                        <span>Delivery address / post office</span>
                        <input
                          value={deliveryAddress}
                          maxLength={160}
                          onChange={(event) =>
                            setDeliveryAddress(event.target.value)
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                </section>

                <section className={css.card} aria-labelledby="payment-title">
                  <h2 className={css.cardTitle} id="payment-title">
                    Payment method
                  </h2>

                  <div className={css.optionsGrid}>
                    <label className={css.optionCard}>
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                      />
                      <span>Cash on pickup / delivery</span>
                    </label>

                    <label className={css.optionCard}>
                      <input
                        type="radio"
                        name="payment"
                        value="bank-transfer"
                        checked={paymentMethod === 'bank-transfer'}
                        onChange={() => setPaymentMethod('bank-transfer')}
                      />
                      <span>Bank transfer</span>
                    </label>
                  </div>

                  {paymentMethod === 'bank-transfer' ? (
                    <div className={css.bankDetails}>
                      {[selectedOrderGroup].map((group) => (
                        <div className={css.bankCard} key={group.storeId}>
                          <h3>{group.storeName}</h3>
                          <p>Recipient: {group.storeName} LLC</p>
                          <p>
                            IBAN: UA00 0000 0000 0000 {group.storeId.slice(-8)}
                          </p>
                          <p>Payment purpose: E-PHARMACY order</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className={css.card} aria-labelledby="comment-title">
                  <h2 className={css.cardTitle} id="comment-title">
                    Order comment
                  </h2>
                  <label className={css.fieldWide}>
                    <span>Comment for pharmacy</span>
                    <textarea
                      value={comment}
                      maxLength={240}
                      onChange={(event) => setComment(event.target.value)}
                    />
                  </label>
                </section>
              </div>

              <aside className={css.summary} aria-labelledby="summary-title">
                <h2 className={css.cardTitle} id="summary-title">
                  Pharmacy invoice
                </h2>

                <ul className={css.invoiceList}>
                  {[selectedOrderGroup].map((group) => (
                    <li className={css.invoiceCard} key={group.storeId}>
                      <h3>{group.storeName}</h3>
                      <p>{group.totalItems} items</p>
                      <p className={css.invoiceTotal}>
                        {formatPrice(group.totalPrice)}
                      </p>
                    </li>
                  ))}
                </ul>

                <dl className={css.totalList}>
                  <div>
                    <dt>Total items</dt>
                    <dd>{selectedOrderGroup.totalItems}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatPrice(selectedOrderGroup.totalPrice)}</dd>
                  </div>
                </dl>

                <Button
                  type="button"
                  fullWidth
                  disabled={!canSubmit}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm invoice'}
                </Button>
              </aside>
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

export default CheckoutPageContent;
