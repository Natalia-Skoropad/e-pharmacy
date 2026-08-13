'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Clock, Info, Mail, MapPin, Phone, Truck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { DELIVERY_METHOD_LABELS } from '@e-pharmacy/config/presentation';
import { CopyButton, LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { RadioOption } from '@e-pharmacy/ui/forms';

import {
  AddressInput,
  CommentInput,
  NameInput,
  PhoneInput,
} from '@e-pharmacy/ui/forms';

import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import type { BreadcrumbItem } from '@e-pharmacy/ui/navigation';
import type { PaymentMethod, DeliveryMethod } from '@e-pharmacy/types/orders';

import {
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  hasValidationErrors,
  validateOrderDeliveryForm,
} from '@e-pharmacy/validation/order';

import { groupCartByPharmacy } from '@/lib/cart/cart-groups';
import { hasCartGroupStockConflict } from '@/lib/cart/cart-stock';

import {
  getPharmacyAddress,
  getPharmacyBankDetails,
  getPharmacyEmail,
  getPharmacyPhone,
  getPharmacyWorkingHours,
} from '@/lib/checkout/checkout-utils';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/seo/metadata-copy';
import { ROUTES } from '@/lib/routes';
import { useClientAuthCapabilities, useClipboardAction } from '@/hooks';

import { WorkingHours } from '@/components/common';

import CheckoutOrderPanel from '../CheckoutOrderPanel';
import CheckoutPaymentMethod from '../CheckoutPaymentMethod/CheckoutPaymentMethod';
import { useCheckoutCart } from '../hooks/useCheckoutCart';
import { useCheckoutPharmacy } from '../hooks/useCheckoutPharmacy';
import { useCheckoutSubmit } from '../hooks/useCheckoutSubmit';
import { useCheckoutDeliveryForm } from '../hooks/useCheckoutDeliveryForm';

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

//===================================================================

function CheckoutPageContent({ checkoutPharmacyId }: CheckoutPageContentProps) {
  const { isBootstrapping, user, canUseClientFeatures } =
    useClientAuthCapabilities();
  const searchParams = useSearchParams();
  const queryPharmacyId = searchParams.get('pharmacyId');
  const selectedPharmacyIdFromRoute = checkoutPharmacyId ?? queryPharmacyId;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');

  const clipboard = useClipboardAction();

  const { cart, error, isLoading, replaceCartFromServer, setError } =
    useCheckoutCart(!isBootstrapping, canUseClientFeatures);

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

  const { pharmacy, pharmacyStatus, pharmacyError, isPharmacyLoading } =
    useCheckoutPharmacy(selectedOrderGroup);

  const hasPharmacyLoadError =
    pharmacyStatus === 'error' && pharmacyError !== null;

  const shouldSelectOrder =
    !isLoading && cart.items.length > 0 && !selectedOrderGroup;

  const selectOrderMessage = selectedPharmacyIdFromRoute
    ? 'This checkout link is no longer valid. Return to cart and choose an active pharmacy order.'
    : 'You have several pharmacy orders in your cart. Please choose the order you want to confirm from the cart page.';

  const {
    values: deliveryValues,
    errors: deliveryFormErrors,
    touchedFields: deliveryTouchedFields,
    isValid: isDeliveryFormValid,
    setFieldValue: setDeliveryFieldValue,
    markInvalidFieldsTouched,
  } = useCheckoutDeliveryForm({
    deliveryMethod,
    userDefaults: {
      recipientName: user?.name,
      recipientPhone: user?.phone,
      deliveryAddress: user?.address,
    },
  });

  const { recipientName, recipientPhone, deliveryAddress, comment } =
    deliveryValues;

  const bankDetails = getPharmacyBankDetails(pharmacy);

  const canUseSelectedPayment =
    paymentMethod !== 'bank_transfer' || Boolean(bankDetails);

  const pharmacyEmail = getPharmacyEmail(pharmacy);
  const pharmacyPhone = getPharmacyPhone(pharmacy);
  const pharmacyWorkingHours = getPharmacyWorkingHours(pharmacy);
  const pharmacyAddress = getPharmacyAddress(pharmacy);

  const hasPharmacyContactDetails = Boolean(
    pharmacyPhone || pharmacyEmail || pharmacyWorkingHours || pharmacyAddress
  );

  const hasStockConflict = selectedOrderGroup
    ? hasCartGroupStockConflict(selectedOrderGroup)
    : false;

  const canSubmit =
    Boolean(selectedOrderGroup) &&
    pharmacyStatus === 'success' &&
    !hasStockConflict &&
    isDeliveryFormValid &&
    canUseSelectedPayment;

  const { isSubmitting, handleSubmit } = useCheckoutSubmit({
    isAuthenticated: canUseClientFeatures,
    selectedOrderGroup,
    paymentMethod,
    deliveryMethod,
    recipientNameValue: recipientName,
    recipientPhoneValue: recipientPhone,
    deliveryAddressValue: deliveryAddress,
    comment,
    canSubmit,
    replaceCartFromServer,
    setError,
  });

  const handleRecipientNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isSubmitting) return;
    setDeliveryFieldValue('recipientName', event.target.value);
  };

  const handleRecipientPhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isSubmitting) return;
    setDeliveryFieldValue('recipientPhone', event.target.value);
  };

  const handleDeliveryAddressChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (isSubmitting) return;
    setDeliveryFieldValue('deliveryAddress', event.target.value);
  };

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (isSubmitting) return;
    setDeliveryFieldValue('comment', event.target.value);
  };

  const handleCheckoutSubmit = async () => {
    if (isSubmitting) return;

    const nextErrors = validateOrderDeliveryForm(
      deliveryValues,
      deliveryMethod
    );

    if (hasValidationErrors(nextErrors)) {
      markInvalidFieldsTouched(nextErrors);
      return;
    }

    await handleSubmit();
  };

  return (
    <main className={css.page}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {clipboard.statusMessage}
      </p>

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
                    <fieldset
                      className={css.deliveryOptionsGrid}
                      disabled={isSubmitting}
                    >
                      <legend className="visually-hidden">
                        Delivery method
                      </legend>

                      <RadioOption
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === 'pickup'}
                        label={DELIVERY_METHOD_LABELS.pickup}
                        disabled={isSubmitting}
                        onChange={setDeliveryMethod}
                      />

                      <RadioOption
                        name="delivery"
                        value="postal_delivery"
                        checked={deliveryMethod === 'postal_delivery'}
                        label={DELIVERY_METHOD_LABELS.postal_delivery}
                        disabled={isSubmitting}
                        onChange={setDeliveryMethod}
                      />
                    </fieldset>

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

                          {hasPharmacyLoadError ? (
                            <p className={css.deliveryMutedText} role="alert">
                              Could not load pharmacy checkout details. Refresh
                              the page before confirming this order.
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

                              {pharmacyEmail ? (
                                <li>
                                  <Mail size={18} aria-hidden="true" />
                                  <span className={css.emailActions}>
                                    <a href={`mailto:${pharmacyEmail}`}>
                                      {pharmacyEmail}
                                    </a>
                                    <CopyButton
                                      label={`Copy pharmacy email ${pharmacyEmail}`}
                                      disabled={isSubmitting}
                                      onClick={() =>
                                        void clipboard.copy(
                                          pharmacyEmail,
                                          'Pharmacy email'
                                        )
                                      }
                                    />
                                  </span>
                                </li>
                              ) : null}

                              {pharmacyWorkingHours ? (
                                <li>
                                  <Clock size={18} aria-hidden="true" />
                                  <WorkingHours
                                    className={css.checkoutWorkingHours}
                                    value={pharmacyWorkingHours}
                                  />
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

                          {pharmacyStatus === 'success' &&
                          !hasPharmacyContactDetails ? (
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
                              maxLength={USER_NAME_MAX_LENGTH}
                              disabled={isSubmitting}
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
                              maxLength={USER_PHONE_MAX_LENGTH}
                              disabled={isSubmitting}
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
                                maxLength={USER_ADDRESS_MAX_LENGTH}
                                disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  onPaymentMethodChange={setPaymentMethod}
                  onCopy={clipboard.copy}
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
                    maxLength={USER_ORDER_COMMENT_MAX_LENGTH}
                    disabled={isSubmitting}
                    onChange={handleCommentChange}
                  />
                </section>
              </div>

              <CheckoutOrderPanel
                orderGroup={selectedOrderGroup}
                canSubmit={canSubmit}
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

export default CheckoutPageContent;

//===================================================================

function CheckoutSelectOrderState({ message }: { message: string }) {
  return (
    <div className={css.empty}>
      <h2 className={css.emptyTitle}>Choose a pharmacy order</h2>
      <p className={css.emptyText}>{message}</p>
      <div className={css.emptyActions}>
        <LinkButton className={css.selectOrderButton} href={ROUTES.CART}>
          Back to cart
        </LinkButton>
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
        <LinkButton href={ROUTES.CART} variant="secondary">
          Back to cart
        </LinkButton>

        <LinkButton href={ROUTES.PRODUCTS_CATALOG}>Browse products</LinkButton>
      </div>
    </div>
  );
}
