'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Clock, Info, MapPin, Phone, Truck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import CheckoutInvoicePanel from '../CheckoutInvoicePanel';
import CheckoutPaymentMethod from '../CheckoutPaymentMethod';

import { useCheckoutCart } from '../hooks/useCheckoutCart';
import { useCheckoutStore } from '../hooks/useCheckoutStore';
import { useCheckoutSubmit } from '../hooks/useCheckoutSubmit';

import {
  ButtonLink,
  Container,
  LoadingSpinner,
  RadioOption,
} from '@e-pharmacy/ui/common';

import {
  AddressInput,
  CommentInput,
  NameInput,
  PhoneInput,
} from '@e-pharmacy/ui/form-fields';

import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { groupCartByStore } from '@/lib/cart/cart-groups';

import {
  getStoreAddress,
  getStoreBankDetails,
  getStoreEmail,
  getStorePhone,
  getStoreWorkingHours,
} from '@/lib/checkout';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@e-pharmacy/config/seo';
import { ROUTES } from '@e-pharmacy/config/routes';

import {
  sanitizeAddress,
  sanitizeName,
  sanitizeOrderComment,
  sanitizePhone,
  validateOrderDeliveryForm,
} from '@e-pharmacy/validation';

import { useAuth } from '@/providers';
import type { BreadcrumbItem } from '@e-pharmacy/types';

import type { CheckoutPaymentMethod as PaymentMethod } from '@e-pharmacy/types/checkout';

import type { OrderDeliveryMethod as DeliveryMethod } from '@e-pharmacy/types/orders';

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

const POST_DELIVERY_FIELDS_ARE_INSTANT_VALIDATED = true;

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

  const deliveryFormValues = useMemo(
    () => ({
      recipientName: recipientNameValue,
      recipientPhone: recipientPhoneValue,
      deliveryAddress: deliveryAddressValue,
      comment,
    }),
    [comment, deliveryAddressValue, recipientNameValue, recipientPhoneValue]
  );

  const deliveryFormErrors = useMemo(
    () => validateOrderDeliveryForm(deliveryFormValues, deliveryMethod),
    [deliveryFormValues, deliveryMethod]
  );

  const isDeliveryFormValid = Object.keys(deliveryFormErrors).length === 0;

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
    Boolean(selectedOrderGroup) && isDeliveryFormValid && canUseSelectedPayment;

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
    setRecipientName(sanitizeName(event.target.value));
  };

  const handleRecipientPhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecipientPhone(sanitizePhone(event.target.value));
  };

  const handleDeliveryAddressChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDeliveryAddress(sanitizeAddress(event.target.value));
  };

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(sanitizeOrderComment(event.target.value));
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
                <section className={css.card} aria-labelledby="delivery-title">
                  <h2 className={css.cardTitle} id="delivery-title">
                    Delivery method
                  </h2>

                  <div className={css.deliveryChoiceGrid}>
                    <div className={css.deliveryOptionsGrid}>
                      <RadioOption
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === 'pickup'}
                        label="Pickup from pharmacy"
                        onChange={setDeliveryMethod}
                      />

                      <RadioOption
                        name="delivery"
                        value="post"
                        checked={deliveryMethod === 'post'}
                        label="Post delivery"
                        onChange={setDeliveryMethod}
                      />
                    </div>

                    <div className={css.deliveryDetailsPanel}>
                      {deliveryMethod === 'pickup' ? (
                        <PharmacyPickupDetails
                          isStoreLoading={isStoreLoading}
                          hasStoreContactDetails={hasStoreContactDetails}
                          storePhone={storePhone}
                          storeWorkingHours={storeWorkingHours}
                          storeAddress={storeAddress}
                        />
                      ) : (
                        <PostDeliveryFields
                          recipientNameValue={recipientNameValue}
                          recipientPhoneValue={recipientPhoneValue}
                          deliveryAddressValue={deliveryAddressValue}
                          nameError={deliveryFormErrors.recipientName ?? ''}
                          phoneError={deliveryFormErrors.recipientPhone ?? ''}
                          addressError={
                            deliveryFormErrors.deliveryAddress ?? ''
                          }
                          onRecipientNameChange={handleRecipientNameChange}
                          onRecipientPhoneChange={handleRecipientPhoneChange}
                          onDeliveryAddressChange={handleDeliveryAddressChange}
                        />
                      )}
                    </div>
                  </div>
                </section>

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
                    error={deliveryFormErrors.comment}
                    isTouched={Boolean(comment)}
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

type PharmacyPickupDetailsProps = {
  isStoreLoading: boolean;
  hasStoreContactDetails: boolean;
  storePhone: string;
  storeWorkingHours: string;
  storeAddress: string;
};

//===================================================================

function PharmacyPickupDetails({
  isStoreLoading,
  hasStoreContactDetails,
  storePhone,
  storeWorkingHours,
  storeAddress,
}: PharmacyPickupDetailsProps) {
  return (
    <div className={css.deliveryInfoCard}>
      <h3 className={css.deliveryInfoTitle}>Pharmacy details</h3>

      {isStoreLoading ? (
        <p className={css.deliveryMutedText}>Loading pharmacy details...</p>
      ) : null}

      {hasStoreContactDetails ? (
        <ul className={css.deliveryIconList}>
          {storePhone ? (
            <li>
              <Phone size={18} aria-hidden="true" />
              <a href={`tel:${storePhone}`}>{storePhone}</a>
            </li>
          ) : null}

          {storeWorkingHours ? (
            <li>
              <Clock size={18} aria-hidden="true" />
              <span>{storeWorkingHours}</span>
            </li>
          ) : null}

          {storeAddress ? (
            <li>
              <MapPin size={18} aria-hidden="true" />
              <span>{storeAddress}</span>
            </li>
          ) : null}
        </ul>
      ) : null}

      {!isStoreLoading && !hasStoreContactDetails ? (
        <p className={css.deliveryMutedText}>
          Pharmacy contact details are unavailable right now.
        </p>
      ) : null}
    </div>
  );
}

//===================================================================

type PostDeliveryFieldsProps = {
  recipientNameValue: string;
  recipientPhoneValue: string;
  deliveryAddressValue: string;
  nameError: string;
  phoneError: string;
  addressError: string;
  onRecipientNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRecipientPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeliveryAddressChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

//===================================================================

function PostDeliveryFields({
  recipientNameValue,
  recipientPhoneValue,
  deliveryAddressValue,
  nameError,
  phoneError,
  addressError,
  onRecipientNameChange,
  onRecipientPhoneChange,
  onDeliveryAddressChange,
}: PostDeliveryFieldsProps) {
  return (
    <div className={css.deliveryFields}>
      <div className={css.deliveryFieldsGrid}>
        <NameInput
          id="recipient-name"
          name="recipientName"
          value={recipientNameValue}
          error={nameError}
          isTouched={POST_DELIVERY_FIELDS_ARE_INSTANT_VALIDATED}
          onChange={onRecipientNameChange}
        />

        <PhoneInput
          id="recipient-phone"
          name="recipientPhone"
          value={recipientPhoneValue}
          error={phoneError}
          isTouched={POST_DELIVERY_FIELDS_ARE_INSTANT_VALIDATED}
          onChange={onRecipientPhoneChange}
        />

        <div className={css.deliveryFieldWide}>
          <AddressInput
            id="delivery-address"
            name="deliveryAddress"
            value={deliveryAddressValue}
            error={addressError}
            isTouched={POST_DELIVERY_FIELDS_ARE_INSTANT_VALIDATED}
            onChange={onDeliveryAddressChange}
          />
        </div>
      </div>

      <div className={css.deliveryNotes}>
        <div className={css.deliveryNoteCard}>
          <Truck size={18} aria-hidden="true" />
          <p>
            After confirmation, the pharmacy will contact you to confirm or
            clarify the delivery address.
          </p>
        </div>

        <div className={css.deliveryNoteCardAccent}>
          <Info size={18} aria-hidden="true" />
          <p>
            Delivery is not included in the product price. The carrier will
            announce the delivery cost separately.
          </p>
        </div>
      </div>
    </div>
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
