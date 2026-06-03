'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';

import CheckoutDeliveryMethod from '../CheckoutDeliveryMethod';
import CheckoutInvoicePanel from '../CheckoutInvoicePanel';
import CheckoutPaymentMethod from '../CheckoutPaymentMethod';

import { useCheckoutCart } from '../hooks/useCheckoutCart';
import { useCheckoutStore } from '../hooks/useCheckoutStore';
import { useCheckoutSubmit } from '../hooks/useCheckoutSubmit';

import { ButtonLink, Container, LoadingSpinner } from '@e-pharmacy/ui/common';
import { CommentInput } from '@e-pharmacy/ui/form-fields';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { groupCartByStore } from '@/lib/cart/cart-groups';

import {
  getStoreAddress,
  getStoreBankDetails,
  getStoreEmail,
  getStorePhone,
  getStoreWorkingHours,
} from '@/lib/checkout';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';

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

import type { BreadcrumbItem } from '@/types';

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

const CHECKOUT_BREADCRUMBS: BreadcrumbItem[] = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Cart', href: ROUTES.CART },
  { label: CHECKOUT_TITLE },
];

//===================================================================

function CheckoutPageContent({ checkoutStoreId }: CheckoutPageContentProps) {
  const { sessionMarker, user } = useAuth();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get('storeId');
  const selectedStoreIdFromRoute = checkoutStoreId ?? queryStoreId;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const { cart, error, isLoading, setCart, setError } =
    useCheckoutCart(sessionMarker);

  const orderGroups = useMemo(() => groupCartByStore(cart), [cart]);
  const selectedOrderGroup = useMemo(() => {
    if (orderGroups.length === 0) return null;

    if (selectedStoreIdFromRoute) {
      return (
        orderGroups.find(
          (group) => group.storeId === selectedStoreIdFromRoute
        ) ?? null
      );
    }

    return orderGroups.length === 1 ? orderGroups[0] : null;
  }, [selectedStoreIdFromRoute, orderGroups]);

  const { store, isStoreLoading } = useCheckoutStore(selectedOrderGroup);

  const shouldSelectInvoice =
    !isLoading && cart.items.length > 0 && !selectedOrderGroup;

  const selectInvoiceMessage = selectedStoreIdFromRoute
    ? 'This pharmacy invoice is not available in your cart anymore. Please return to the cart and choose an active invoice.'
    : 'You have several pharmacy invoices in your cart. Please choose the invoice you want to confirm from the cart page.';

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
  const storeEmail = getStoreEmail(store);
  const storePhone = getStorePhone(store);
  const storeWorkingHours = getStoreWorkingHours(store);
  const storeAddress = getStoreAddress(store);
  const hasStoreContactDetails = Boolean(
    storePhone || storeWorkingHours || storeAddress
  );

  const canSubmit =
    Boolean(selectedOrderGroup) && isPostDeliveryValid && canUseSelectedPayment;

  const { isSubmitting, handleSubmit } = useCheckoutSubmit({
    sessionMarker,
    selectedOrderGroup,
    paymentMethod,
    deliveryMethod,
    recipientNameValue,
    recipientPhoneValue,
    deliveryAddressValue,
    comment,
    canSubmit,
    setCart,
    setError,
  });

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

          {shouldSelectInvoice ? (
            <CheckoutSelectInvoiceState message={selectInvoiceMessage} />
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
                canSubmit={canSubmit && !isSubmitting}
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

function CheckoutSelectInvoiceState({ message }: { message: string }) {
  return (
    <div className={css.empty}>
      <h2 className={css.emptyTitle}>Choose a pharmacy invoice</h2>
      <p className={css.emptyText}>{message}</p>
      <div className={css.emptyActions}>
        <ButtonLink href={ROUTES.CART}>Back to cart</ButtonLink>
      </div>
    </div>
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
