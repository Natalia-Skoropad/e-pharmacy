'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Clock, Info, MapPin, Phone, Truck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import CheckoutOrderPanel from '../CheckoutOrderPanel';
import CheckoutPaymentMethod from '../CheckoutPaymentMethod';

import { useCheckoutCart } from '../hooks/useCheckoutCart';
import { useCheckoutPharmacy } from '../hooks/useCheckoutPharmacy';
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
import { groupCartByPharmacy } from '@/lib/cart/cart-groups';

import {
  getPharmacyAddress,
  getPharmacyBankDetails,
  getPharmacyEmail,
  getPharmacyPhone,
  getPharmacyWorkingHours,
} from '@/lib/checkout';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@e-pharmacy/config/seo';
import { ROUTES } from '@e-pharmacy/config/routes';

import {
  ORDER_DELIVERY_INITIAL_VALUES,
  ORDER_DELIVERY_FORM_FIELDS,
  hasValidationErrors,
  isOrderDeliveryFormValid,
  markAllFieldsTouched,
  sanitizeAddress,
  sanitizeName,
  sanitizeOrderComment,
  sanitizePhone,
  validateOrderDeliveryForm,
  type OrderDeliveryFormValues,
  type OrderDeliveryTouchedFields,
} from '@e-pharmacy/validation';

import { useAuth } from '@e-pharmacy/auth/core';
import type { BreadcrumbItem } from '@e-pharmacy/types';

import type { PaymentMethod } from '@e-pharmacy/types/orders';
import type { DeliveryMethod } from '@e-pharmacy/types/orders';

import css from './CheckoutPageContent.module.css';

//===================================================================

type CheckoutPageContentProps = {
  checkoutPharmacyId?: string;
};

//===================================================================

const CHECKOUT_BREADCRUMBS: BreadcrumbItem[] = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Cart', href: ROUTES.CART },
  { label: CHECKOUT_TITLE },
];

function CheckoutPageContent({ checkoutPharmacyId }: CheckoutPageContentProps) {
  const { isAuthenticated, isAuthReady, user } = useAuth();
  const searchParams = useSearchParams();
  const queryPharmacyId = searchParams.get('pharmacyId');
  const selectedPharmacyIdFromRoute = checkoutPharmacyId ?? queryPharmacyId;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');

  const [deliveryDraftValues, setDeliveryDraftValues] =
    useState<OrderDeliveryFormValues>(ORDER_DELIVERY_INITIAL_VALUES);

  const [deliveryTouchedFields, setDeliveryTouchedFields] =
    useState<OrderDeliveryTouchedFields>({});
  const [copiedEmail, setCopiedEmail] = useState(false);

  const { cart, error, isLoading, setCart, setError } = useCheckoutCart(
    isAuthReady,
    isAuthenticated
  );

  const orderGroups = useMemo(() => groupCartByPharmacy(cart), [cart]);

  const selectedOrderGroup = useMemo(() => {
    if (orderGroups.length === 0) return null;

    if (selectedPharmacyIdFromRoute) {
      return (
        orderGroups.find(
          (group) => group.pharmacyId === selectedPharmacyIdFromRoute
        ) ?? null
      );
    }

    return orderGroups.length === 1 ? orderGroups[0] : null;
  }, [selectedPharmacyIdFromRoute, orderGroups]);

  const { pharmacy, isPharmacyLoading } =
    useCheckoutPharmacy(selectedOrderGroup);

  const shouldSelectOrder =
    !isLoading && cart.items.length > 0 && !selectedOrderGroup;

  const selectOrderMessage = selectedPharmacyIdFromRoute
    ? 'This pharmacy order is not available in your cart anymore. Please return to the cart and choose an active order.'
    : 'You have several pharmacy orders in your cart. Please choose the order you want to confirm from the cart page.';

  const deliveryValues = useMemo<OrderDeliveryFormValues>(
    () => ({
      ...deliveryDraftValues,
      recipientName: deliveryTouchedFields.recipientName
        ? deliveryDraftValues.recipientName
        : deliveryDraftValues.recipientName || user?.name || '',
      recipientPhone: deliveryTouchedFields.recipientPhone
        ? deliveryDraftValues.recipientPhone
        : deliveryDraftValues.recipientPhone || user?.phone || '',
      deliveryAddress: deliveryTouchedFields.deliveryAddress
        ? deliveryDraftValues.deliveryAddress
        : deliveryDraftValues.deliveryAddress || user?.address || '',
    }),
    [deliveryDraftValues, deliveryTouchedFields, user]
  );

  const deliveryFormErrors = useMemo(
    () => validateOrderDeliveryForm(deliveryValues, deliveryMethod),
    [deliveryValues, deliveryMethod]
  );

  const isDeliveryFormValid = isOrderDeliveryFormValid(
    deliveryValues,
    deliveryMethod
  );

  const { recipientName, recipientPhone, deliveryAddress, comment } =
    deliveryValues;

  const bankDetails = getPharmacyBankDetails(pharmacy);

  const canUseSelectedPayment =
    paymentMethod !== 'bank-transfer' || Boolean(bankDetails);

  const pharmacyEmail = getPharmacyEmail(pharmacy);
  const pharmacyPhone = getPharmacyPhone(pharmacy);
  const pharmacyWorkingHours = getPharmacyWorkingHours(pharmacy);
  const pharmacyAddress = getPharmacyAddress(pharmacy);
  const hasPharmacyContactDetails = Boolean(
    pharmacyPhone || pharmacyWorkingHours || pharmacyAddress
  );

  const canSubmit =
    Boolean(selectedOrderGroup) && isDeliveryFormValid && canUseSelectedPayment;

  const { isSubmitting, handleSubmit } = useCheckoutSubmit({
    isAuthenticated,
    selectedOrderGroup,
    paymentMethod,
    deliveryMethod,
    recipientNameValue: recipientName,
    recipientPhoneValue: recipientPhone,
    deliveryAddressValue: deliveryAddress,
    comment,
    canSubmit,
    setCart,
    setError,
  });

  const handleDeliveryFieldChange = (
    field: keyof OrderDeliveryFormValues,
    value: string
  ) => {
    setDeliveryTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    setDeliveryDraftValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecipientNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleDeliveryFieldChange(
      'recipientName',
      sanitizeName(event.target.value)
    );
  };

  const handleRecipientPhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleDeliveryFieldChange(
      'recipientPhone',
      sanitizePhone(event.target.value)
    );
  };

  const handleDeliveryAddressChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    handleDeliveryFieldChange(
      'deliveryAddress',
      sanitizeAddress(event.target.value)
    );
  };

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    handleDeliveryFieldChange(
      'comment',
      sanitizeOrderComment(event.target.value)
    );
  };

  const handleCopyEmail = async () => {
    try {
      if (!pharmacyEmail) return;

      await navigator.clipboard.writeText(pharmacyEmail);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      setCopiedEmail(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    const nextErrors = validateOrderDeliveryForm(
      deliveryValues,
      deliveryMethod
    );

    if (deliveryMethod === 'post') {
      setDeliveryTouchedFields((prev) => ({
        ...prev,
        ...markAllFieldsTouched(ORDER_DELIVERY_FORM_FIELDS),
      }));
    }

    if (hasValidationErrors(nextErrors)) return;

    await handleSubmit();
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
              <LoadingSpinner label="Loading checkout order..." />
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

          {shouldSelectOrder ? (
            <CheckoutSelectOrderState message={selectOrderMessage} />
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
                        <div className={css.deliveryInfoCard}>
                          <h3 className={css.deliveryInfoTitle}>
                            Pharmacy details
                          </h3>

                          {isPharmacyLoading ? (
                            <p className={css.deliveryMutedText}>
                              Loading pharmacy details...
                            </p>
                          ) : null}

                          {hasPharmacyContactDetails ? (
                            <ul className={css.deliveryIconList}>
                              {pharmacyPhone ? (
                                <li>
                                  <Phone size={18} aria-hidden="true" />
                                  <a href={`tel:${pharmacyPhone}`}>
                                    {pharmacyPhone}
                                  </a>
                                </li>
                              ) : null}

                              {pharmacyWorkingHours ? (
                                <li>
                                  <Clock size={18} aria-hidden="true" />
                                  <span>{pharmacyWorkingHours}</span>
                                </li>
                              ) : null}

                              {pharmacyAddress ? (
                                <li>
                                  <MapPin size={18} aria-hidden="true" />
                                  <span>{pharmacyAddress}</span>
                                </li>
                              ) : null}
                            </ul>
                          ) : null}

                          {!isPharmacyLoading && !hasPharmacyContactDetails ? (
                            <p className={css.deliveryMutedText}>
                              Pharmacy contact details are unavailable right
                              now.
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className={css.deliveryFields}>
                          <div className={css.deliveryFieldsGrid}>
                            <NameInput
                              id="recipient-name"
                              name="recipientName"
                              value={recipientName}
                              error={deliveryFormErrors.recipientName ?? ''}
                              isTouched={Boolean(
                                deliveryTouchedFields.recipientName
                              )}
                              onChange={handleRecipientNameChange}
                            />

                            <PhoneInput
                              id="recipient-phone"
                              name="recipientPhone"
                              value={recipientPhone}
                              error={deliveryFormErrors.recipientPhone ?? ''}
                              isTouched={Boolean(
                                deliveryTouchedFields.recipientPhone
                              )}
                              onChange={handleRecipientPhoneChange}
                            />

                            <div className={css.deliveryFieldWide}>
                              <AddressInput
                                id="delivery-address"
                                name="deliveryAddress"
                                value={deliveryAddress}
                                error={deliveryFormErrors.deliveryAddress ?? ''}
                                isTouched={Boolean(
                                  deliveryTouchedFields.deliveryAddress
                                )}
                                onChange={handleDeliveryAddressChange}
                              />
                            </div>
                          </div>

                          <div className={css.deliveryNotes}>
                            <div className={css.deliveryNoteCard}>
                              <Truck size={18} aria-hidden="true" />
                              <p>
                                After confirmation, the pharmacy will contact
                                you to confirm or clarify the delivery address.
                              </p>
                            </div>

                            <div className={css.deliveryNoteCardAccent}>
                              <Info size={18} aria-hidden="true" />
                              <p>
                                Delivery is not included in the product price.
                                The carrier will announce the delivery cost
                                separately.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <CheckoutPaymentMethod
                  paymentMethod={paymentMethod}
                  bankDetails={bankDetails}
                  pharmacyEmail={pharmacyEmail}
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
                    isTouched={Boolean(deliveryTouchedFields.comment)}
                    onChange={handleCommentChange}
                  />
                </section>
              </div>

              <CheckoutOrderPanel
                orderGroup={selectedOrderGroup}
                canSubmit={canSubmit && !isSubmitting}
                isSubmitting={isSubmitting}
                onSubmit={() => void handleCheckoutSubmit()}
              />
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

//===================================================================

function CheckoutSelectOrderState({ message }: { message: string }) {
  return (
    <div className={css.empty}>
      <h2 className={css.emptyTitle}>Choose a pharmacy order</h2>
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
        Add products first, then checkout will form pharmacy orders.
      </p>
      <div className={css.emptyActions}>
        <ButtonLink href={ROUTES.CART} variant="secondary">
          Back to cart
        </ButtonLink>

        <ButtonLink href={ROUTES.PRODUCTS_CATALOG}>Browse products</ButtonLink>
      </div>
    </div>
  );
}

export default CheckoutPageContent;
