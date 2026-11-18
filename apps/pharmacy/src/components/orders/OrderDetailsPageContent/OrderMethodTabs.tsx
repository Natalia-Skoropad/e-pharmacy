'use client';

import {
  CreditCard,
  Info,
  Mail,
  MapPin,
  Phone,
  Save,
  Truck,
  Wallet,
  Clock,
} from 'lucide-react';

import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@e-pharmacy/config/presentation';

import { Button, CopyButton } from '@e-pharmacy/ui/primitives';

import {
  NameInput,
  PhoneInput,
  AddressInput,
  RadioOption,
} from '@e-pharmacy/ui/forms';

import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';
import { formatPharmacyLocation } from '@e-pharmacy/utils/strings';
import { getWorkingHoursDisplayItems } from '@e-pharmacy/validation/pharmacy';

import {
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  type OrderDeliveryFormErrors,
  type OrderDeliveryTouchedFields,
} from '@e-pharmacy/validation/order';

import type { DeliveryMethod, PaymentMethod } from '@e-pharmacy/types/orders';

import type { PharmacyOrderDetails } from '@/lib/orders/orders';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

export function DeliveryTab({
  order,
  isCreateMode,
  isEditable,
  deliveryMethod,
  recipientName,
  recipientPhone,
  deliveryAddress,
  deliveryErrors,
  deliveryTouchedFields,
  isUpdating,
  hasChanges,
  onDeliveryMethodChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  onDeliveryAddressChange,
  onCopyValue,
  onSave,
}: Readonly<{
  order: PharmacyOrderDetails;
  isCreateMode: boolean;
  isEditable: boolean;
  deliveryMethod: DeliveryMethod;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryErrors: OrderDeliveryFormErrors;
  deliveryTouchedFields: OrderDeliveryTouchedFields;
  isUpdating: boolean;
  hasChanges: boolean;
  onDeliveryMethodChange: (value: DeliveryMethod) => void;
  onRecipientNameChange: (value: string) => void;
  onRecipientPhoneChange: (value: string) => void;
  onDeliveryAddressChange: (value: string) => void;
  onCopyValue: (value: string, label: string) => void;
  onSave: () => void;
}>) {
  const workingHours =
    getWorkingHoursDisplayItems(order.pharmacyWorkingHours ?? '') ?? [];

  const pharmacyLocation = formatPharmacyLocation(order.pharmacyLocation);

  return (
    <>
      <div className={css.orderTabHeader}>
        <ProfileSectionHeader
          title="Delivery method"
          titleId="delivery-title"
          description="Choose how the client will receive the order."
          icon={<Truck size={22} aria-hidden="true" />}
          actionClassName={css.methodTitleAction}
          action={
            !isCreateMode ? (
              <Button
                className={css.tabSaveButton}
                type="button"
                variant="primary"
                iconLeft={<Save size={17} aria-hidden="true" />}
                disabled={!isEditable || !hasChanges || isUpdating}
                isLoading={isUpdating}
                onClick={onSave}
              >
                Save delivery method
              </Button>
            ) : undefined
          }
        />
      </div>

      <section className={css.methodCard} aria-labelledby="delivery-title">
        <div className={css.methodGrid}>
          <fieldset
            className={css.methodOptions}
            disabled={!isEditable || isUpdating}
          >
            <legend className="visually-hidden">Delivery method</legend>

            <RadioOption
              name="delivery-method"
              value="pickup"
              checked={deliveryMethod === 'pickup'}
              label={DELIVERY_METHOD_LABELS.pickup}
              disabled={!isEditable || isUpdating}
              onChange={onDeliveryMethodChange}
            />

            <RadioOption
              name="delivery-method"
              value="postal_delivery"
              checked={deliveryMethod === 'postal_delivery'}
              label={DELIVERY_METHOD_LABELS.postal_delivery}
              disabled={!isEditable || isUpdating}
              onChange={onDeliveryMethodChange}
            />
          </fieldset>

          <div className={css.methodDetailsPanel}>
            {deliveryMethod === 'pickup' ? (
              <div className={css.deliveryInfoCard}>
                <h3>Pharmacy details</h3>

                <ul className={css.deliveryIconList}>
                  {order.pharmacyPhone ? (
                    <li>
                      <Phone size={18} aria-hidden="true" />
                      <a href={`tel:${order.pharmacyPhone}`}>
                        {order.pharmacyPhone}
                      </a>
                    </li>
                  ) : null}

                  {order.pharmacyEmail ? (
                    <li className={css.emailRow}>
                      <Mail size={18} aria-hidden="true" />
                      <span className={css.emailActions}>
                        <a href={`mailto:${order.pharmacyEmail}`}>
                          {order.pharmacyEmail}
                        </a>
                        <CopyButton
                          label={`Copy pharmacy email ${order.pharmacyEmail}`}
                          disabled={isUpdating}
                          onClick={() =>
                            onCopyValue(
                              order.pharmacyEmail ?? '',
                              'Pharmacy email'
                            )
                          }
                        />
                      </span>
                    </li>
                  ) : null}

                  <li>
                    <Clock size={18} aria-hidden="true" />
                    {workingHours.length > 0 ? (
                      <span className={css.workingHoursList}>
                        {workingHours.map((item) => (
                          <span key={item.day}>
                            <strong>{item.day}:</strong> {item.hours}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span>Working hours are not specified.</span>
                    )}
                  </li>

                  {pharmacyLocation ? (
                    <li>
                      <MapPin size={18} aria-hidden="true" />
                      <span>{pharmacyLocation}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : (
              <div className={css.deliveryFields}>
                <div className={css.deliveryFieldsGrid}>
                  <NameInput
                    id="recipient-name"
                    name="recipientName"
                    value={recipientName}
                    error={deliveryErrors.recipientName ?? ''}
                    isTouched={Boolean(deliveryTouchedFields.recipientName)}
                    maxLength={USER_NAME_MAX_LENGTH}
                    disabled={!isEditable || isUpdating}
                    onChange={(event) =>
                      onRecipientNameChange(event.target.value)
                    }
                  />

                  <PhoneInput
                    id="recipient-phone"
                    name="recipientPhone"
                    value={recipientPhone}
                    error={deliveryErrors.recipientPhone ?? ''}
                    isTouched={Boolean(deliveryTouchedFields.recipientPhone)}
                    maxLength={USER_PHONE_MAX_LENGTH}
                    disabled={!isEditable || isUpdating}
                    onChange={(event) =>
                      onRecipientPhoneChange(event.target.value)
                    }
                  />

                  <div className={css.deliveryFieldWide}>
                    <AddressInput
                      id="delivery-address"
                      name="deliveryAddress"
                      value={deliveryAddress}
                      error={deliveryErrors.deliveryAddress ?? ''}
                      isTouched={Boolean(deliveryTouchedFields.deliveryAddress)}
                      maxLength={USER_ADDRESS_MAX_LENGTH}
                      disabled={!isEditable || isUpdating}
                      onChange={(event) =>
                        onDeliveryAddressChange(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className={css.deliveryNotes}>
                  <div className={css.deliveryNoteCard}>
                    <Truck size={18} aria-hidden="true" />
                    <p>
                      After confirmation, the pharmacy will contact the client
                      to confirm or clarify the delivery address.
                    </p>
                  </div>

                  <div className={css.deliveryNoteCardAccent}>
                    <Info size={18} aria-hidden="true" />
                    <p>
                      Delivery is not included in the product price. The carrier
                      will announce the delivery cost separately.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

//===================================================================

export function PaymentTab({
  order,
  isCreateMode,
  paymentMethod,
  isEditable,
  isUpdating,
  hasChanges,
  onPaymentMethodChange,
  onCopyValue,
  onSave,
}: Readonly<{
  order: PharmacyOrderDetails;
  isCreateMode: boolean;
  paymentMethod: PaymentMethod;
  isEditable: boolean;
  isUpdating: boolean;
  hasChanges: boolean;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onCopyValue: (value: string, label: string) => void;
  onSave: () => void;
}>) {
  const bankDetails = order.bankDetails;

  const bankRows = bankDetails
    ? ([
        ['Recipient name', bankDetails.recipientName],
        ['Tax ID / EDRPOU', bankDetails.taxId],
        ['IBAN', bankDetails.iban],
        ['Bank name', bankDetails.bankName],
        ['Payment purpose', bankDetails.paymentPurpose],
      ] as const)
    : [];

  return (
    <>
      <div className={css.orderTabHeader}>
        <ProfileSectionHeader
          title="Payment method"
          titleId="payment-title"
          description="Choose how the client will pay for the order."
          icon={<CreditCard size={22} aria-hidden="true" />}
          actionClassName={css.methodTitleAction}
          action={
            !isCreateMode ? (
              <Button
                className={css.tabSaveButton}
                type="button"
                variant="primary"
                iconLeft={<Save size={17} aria-hidden="true" />}
                disabled={
                  !isEditable ||
                  !hasChanges ||
                  isUpdating ||
                  (paymentMethod === 'bank_transfer' && !bankDetails)
                }
                isLoading={isUpdating}
                onClick={onSave}
              >
                Save payment method
              </Button>
            ) : undefined
          }
        />
      </div>

      <section className={css.methodCard} aria-labelledby="payment-title">
        <div className={css.methodGrid}>
          <fieldset
            className={css.methodOptions}
            disabled={!isEditable || isUpdating}
          >
            <legend className="visually-hidden">Payment method</legend>

            <RadioOption
              name="payment-method"
              value="cash"
              checked={paymentMethod === 'cash'}
              label={PAYMENT_METHOD_LABELS.cash}
              disabled={!isEditable || isUpdating}
              onChange={onPaymentMethodChange}
            />

            <RadioOption
              name="payment-method"
              value="bank_transfer"
              checked={paymentMethod === 'bank_transfer'}
              label={PAYMENT_METHOD_LABELS.bank_transfer}
              disabled={!isEditable || isUpdating || !bankDetails}
              onChange={onPaymentMethodChange}
            />
          </fieldset>

          <div className={css.methodDetailsPanel}>
            {paymentMethod === 'cash' ? (
              <div className={css.paymentInfoCard}>
                <Wallet size={20} aria-hidden="true" />
                <h3>Pay when everything is ready</h3>
                <p>
                  Cash is paid during pickup or delivery. Please keep the order
                  amount ready when the client receives the order.
                </p>
              </div>
            ) : (
              <div className={css.bankDetailsStack}>
                <div className={css.bankCard}>
                  <h3>Bank details</h3>

                  {bankDetails ? (
                    <dl className={css.bankList}>
                      {bankRows.map(([label, value]) => (
                        <div className={css.bankRow} key={label}>
                          <dt>{label}</dt>
                          <dd>
                            <span>{value}</span>
                          </dd>
                          <span className={css.bankCopyAction}>
                            <CopyButton
                              label={`Copy ${label} ${value}`}
                              disabled={isUpdating}
                              onClick={() => onCopyValue(value, label)}
                            />
                          </span>
                        </div>
                      ))}
                      {bankDetails.receiptEmail ? (
                        <div className={css.bankRow}>
                          <dt>Receipt email</dt>
                          <dd>
                            <a href={`mailto:${bankDetails.receiptEmail}`}>
                              {bankDetails.receiptEmail}
                            </a>
                          </dd>
                          <span className={css.bankCopyAction}>
                            <CopyButton
                              label={`Copy receipt email ${bankDetails.receiptEmail}`}
                              disabled={isUpdating}
                              onClick={() =>
                                onCopyValue(
                                  bankDetails.receiptEmail ?? '',
                                  'Receipt email'
                                )
                              }
                            />
                          </span>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className={css.metaText}>
                      Bank transfer is unavailable because the pharmacy has not
                      provided bank details yet.
                    </p>
                  )}
                </div>

                {bankDetails ? (
                  <div className={css.emailNote}>
                    <Mail size={20} aria-hidden="true" />
                    <p>
                      After payment, the client should send the receipt to the
                      pharmacy email for faster processing.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
