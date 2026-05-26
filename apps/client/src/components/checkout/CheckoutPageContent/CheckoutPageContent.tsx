'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import CheckoutDeliveryMethod from '../CheckoutDeliveryMethod';
import CheckoutInvoicePanel from '../CheckoutInvoicePanel';
import CheckoutPaymentMethod from '../CheckoutPaymentMethod';

import { ButtonLink, Container, LoadingSpinner } from '@/components/common';
import { CommentInput } from '@/components/form-fields';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

import { dispatchCartUpdated } from '@/lib/cart/cart-events';

import {
  getStockValidationError,
  getStoreAddress,
  getStoreBankDetails,
  getStoreEmail,
  getStorePhone,
  getStoreWorkingHours,
  groupCartByStore,
} from '@/lib/checkout';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { buildCustomerOrderPath } from '@/lib/orders';

import {
  CUSTOMER_ADDRESS_MAX_LENGTH,
  CUSTOMER_ADDRESS_MIN_LENGTH,
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_PHONE_MAX_LENGTH,
  getCustomerAddressError,
  getCustomerNameError,
  getCustomerPhoneError,
  sanitizeCustomerAddress,
  sanitizeCustomerName,
  sanitizeCustomerPhone,
} from '@/lib/validations';

import { useAuth } from '@/providers';
import { checkoutOrder, getCart, getStoreDetails } from '@/services';

import type { BreadcrumbItem, Cart, Store } from '@/types';
import type {
  CheckoutDeliveryMethod as DeliveryMethod,
  CheckoutPaymentMethod as PaymentMethod,
} from '@/types/checkout';

import css from './CheckoutPageContent.module.css';

//===================================================================

type CheckoutPageContentProps = {
  checkoutStoreId?: string;
};

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

const CHECKOUT_BREADCRUMBS: BreadcrumbItem[] = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Cart', href: ROUTES.CART },
  { label: CHECKOUT_TITLE },
];

//===================================================================

function CheckoutPageContent({ checkoutStoreId }: CheckoutPageContentProps) {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get('storeId');
  const selectedStoreIdFromRoute = checkoutStoreId ?? queryStoreId;

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [store, setStore] = useState<Store | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderGroups = useMemo(() => groupCartByStore(cart), [cart]);
  const selectedOrderGroup = useMemo(() => {
    if (orderGroups.length === 0) return null;

    return (
      orderGroups.find((group) => group.storeId === selectedStoreIdFromRoute) ??
      orderGroups[0]
    );
  }, [selectedStoreIdFromRoute, orderGroups]);

  const recipientNameValue = recipientName ?? user?.name ?? '';
  const recipientPhoneValue = recipientPhone ?? user?.phone ?? '';
  const deliveryAddressValue = deliveryAddress ?? user?.address ?? '';

  const nameError = getCustomerNameError(recipientNameValue);
  const phoneError = getCustomerPhoneError(recipientPhoneValue);
  const addressError = getCustomerAddressError(deliveryAddressValue);
  const isPostDeliveryValid =
    deliveryMethod === 'pickup' ||
    (recipientNameValue.trim().length >= 2 &&
      recipientNameValue.trim().length <= CUSTOMER_NAME_MAX_LENGTH &&
      recipientPhoneValue.trim().length === CUSTOMER_PHONE_MAX_LENGTH &&
      deliveryAddressValue.trim().length >= CUSTOMER_ADDRESS_MIN_LENGTH &&
      deliveryAddressValue.trim().length <= CUSTOMER_ADDRESS_MAX_LENGTH &&
      !nameError &&
      !phoneError &&
      !addressError);

  const bankDetails = getStoreBankDetails(store);
  const canUseSelectedPayment =
    paymentMethod !== 'bank-transfer' || Boolean(bankDetails);
  const canSubmit =
    Boolean(selectedOrderGroup) &&
    isPostDeliveryValid &&
    canUseSelectedPayment &&
    !isSubmitting;
  const storeEmail = getStoreEmail(store);
  const storePhone = getStorePhone(store);
  const storeWorkingHours = getStoreWorkingHours(store);
  const storeAddress = getStoreAddress(store);
  const hasStoreContactDetails = Boolean(
    storePhone || storeWorkingHours || storeAddress
  );

  useEffect(() => {
    const authToken = token;

    let isMounted = true;

    async function fetchCart() {
      if (!authToken) return;

      try {
        const response = await getCart(authToken);

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

  useEffect(() => {
    let isMounted = true;

    async function fetchStore() {
      if (!selectedOrderGroup) return;

      try {
        setIsStoreLoading(true);
        const response = await getStoreDetails(
          selectedOrderGroup.storeId,
          token ?? undefined
        );

        if (!isMounted) return;

        setStore(response.store);
      } catch {
        if (!isMounted) return;

        setStore(null);
      } finally {
        if (!isMounted) return;

        setIsStoreLoading(false);
      }
    }

    void fetchStore();

    return () => {
      isMounted = false;
    };
  }, [selectedOrderGroup, token]);

  const handleRecipientNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecipientName(sanitizeCustomerName(event.target.value));
  };

  const handleRecipientPhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecipientPhone(sanitizeCustomerPhone(event.target.value));
  };

  const handleDeliveryAddressChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDeliveryAddress(sanitizeCustomerAddress(event.target.value));
  };

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(event.target.value);
  };

  const handleCopyEmail = async () => {
    try {
      if (!storeEmail) return;

      await navigator.clipboard.writeText(storeEmail);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      setCopiedEmail(false);
    }
  };

  const handleSubmit = async () => {
    const authToken = token;

    if (!authToken || !canSubmit) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (!selectedOrderGroup) return;

      const latestCartResponse = await getCart(authToken);
      const latestGroups = groupCartByStore(latestCartResponse.cart);
      const latestOrderGroup = latestGroups.find(
        (group) => group.storeId === selectedOrderGroup.storeId
      );

      if (!latestOrderGroup) {
        setCart(latestCartResponse.cart);
        setError(
          'Sorry, we cannot confirm this invoice right now. While you were placing the order, these products were reserved by another customer. Please update the cart and try again.'
        );
        return;
      }

      const stockError = getStockValidationError(latestOrderGroup);

      if (stockError) {
        setCart(latestCartResponse.cart);
        setError(stockError);
        return;
      }

      const response = await checkoutOrder(
        {
          storeId: latestOrderGroup.storeId,
          paymentMethod,
          deliveryMethod,
          ...(deliveryMethod === 'post'
            ? {
                deliveryDetails: {
                  recipientName: recipientNameValue.trim(),
                  recipientPhone: recipientPhoneValue.trim(),
                  address: deliveryAddressValue.trim(),
                },
              }
            : {}),
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        },
        authToken
      );
      const nextCartResponse = await getCart(authToken);

      setCart(nextCartResponse.cart);
      dispatchCartUpdated(nextCartResponse.cart);
      router.push(buildCustomerOrderPath(response.order));
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
          <Breadcrumbs items={CHECKOUT_BREADCRUMBS} />

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

          {!isLoading && cart.items.length === 0 ? (
            <CheckoutEmptyState />
          ) : null}

          {selectedOrderGroup ? (
            <div className={css.grid}>
              <div className={css.leftColumn}>
                <CheckoutDeliveryMethod
                  deliveryMethod={deliveryMethod}
                  recipientNameValue={recipientNameValue}
                  recipientPhoneValue={recipientPhoneValue}
                  deliveryAddressValue={deliveryAddressValue}
                  nameError={nameError}
                  phoneError={phoneError}
                  addressError={addressError}
                  isStoreLoading={isStoreLoading}
                  hasStoreContactDetails={hasStoreContactDetails}
                  storePhone={storePhone}
                  storeWorkingHours={storeWorkingHours}
                  storeAddress={storeAddress}
                  onDeliveryMethodChange={setDeliveryMethod}
                  onRecipientNameChange={handleRecipientNameChange}
                  onRecipientPhoneChange={handleRecipientPhoneChange}
                  onDeliveryAddressChange={handleDeliveryAddressChange}
                />

                <CheckoutPaymentMethod
                  paymentMethod={paymentMethod}
                  bankDetails={bankDetails}
                  storeEmail={storeEmail}
                  copiedEmail={copiedEmail}
                  onPaymentMethodChange={setPaymentMethod}
                  onCopyEmail={() => void handleCopyEmail()}
                />

                <section className={css.card} aria-labelledby="comment-title">
                  <h2 className={css.cardTitle} id="comment-title">
                    Order comment
                  </h2>

                  <CommentInput
                    id="order-comment"
                    name="comment"
                    value={comment}
                    onChange={handleCommentChange}
                  />
                </section>
              </div>

              <CheckoutInvoicePanel
                orderGroup={selectedOrderGroup}
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                onSubmit={() => void handleSubmit()}
              />
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

//===================================================================

function CheckoutEmptyState() {
  return (
    <div className={css.empty}>
      <h2 className={css.emptyTitle}>Your cart is empty</h2>
      <p className={css.emptyText}>
        Add medicines first, then checkout will form pharmacy invoices.
      </p>
      <div className={css.emptyActions}>
        <ButtonLink href={ROUTES.CART} variant="secondary">
          Back to cart
        </ButtonLink>

        <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
          Browse medicines
        </ButtonLink>
      </div>
    </div>
  );
}

export default CheckoutPageContent;
