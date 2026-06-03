import type { ChangeEvent } from 'react';
import { Clock, Info, MapPin, Phone, Truck } from 'lucide-react';

import { RadioOption } from '@e-pharmacy/ui/common';
import { AddressInput, NameInput, PhoneInput } from '@/components/form-fields';
import type { CheckoutDeliveryMethod as DeliveryMethod } from '@/types/checkout';

import css from './CheckoutDeliveryMethod.module.css';

//===================================================================

type CheckoutDeliveryMethodProps = {
  deliveryMethod: DeliveryMethod;
  recipientNameValue: string;
  recipientPhoneValue: string;
  deliveryAddressValue: string;
  nameError: string;
  phoneError: string;
  addressError: string;
  isStoreLoading: boolean;
  hasStoreContactDetails: boolean;
  storePhone: string;
  storeWorkingHours: string;
  storeAddress: string;
  onDeliveryMethodChange: (value: DeliveryMethod) => void;
  onRecipientNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRecipientPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeliveryAddressChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

//===================================================================

function CheckoutDeliveryMethod({
  deliveryMethod,
  recipientNameValue,
  recipientPhoneValue,
  deliveryAddressValue,
  nameError,
  phoneError,
  addressError,
  isStoreLoading,
  hasStoreContactDetails,
  storePhone,
  storeWorkingHours,
  storeAddress,
  onDeliveryMethodChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  onDeliveryAddressChange,
}: CheckoutDeliveryMethodProps) {
  return (
    <section className={css.card} aria-labelledby="delivery-title">
      <h2 className={css.title} id="delivery-title">
        Delivery method
      </h2>

      <div className={css.choiceGrid}>
        <div className={css.optionsGrid}>
          <RadioOption
            name="delivery"
            value="pickup"
            checked={deliveryMethod === 'pickup'}
            label="Pickup from pharmacy"
            onChange={onDeliveryMethodChange}
          />

          <RadioOption
            name="delivery"
            value="post"
            checked={deliveryMethod === 'post'}
            label="Post delivery"
            onChange={onDeliveryMethodChange}
          />
        </div>

        <div className={css.detailsPanel}>
          {deliveryMethod === 'pickup' ? (
            <div className={css.infoCard}>
              <h3 className={css.infoTitle}>Pharmacy details</h3>

              {isStoreLoading ? (
                <p className={css.mutedText}>Loading pharmacy details...</p>
              ) : null}

              {hasStoreContactDetails ? (
                <ul className={css.iconList}>
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
                <p className={css.mutedText}>
                  Pharmacy contact details are unavailable right now.
                </p>
              ) : null}
            </div>
          ) : (
            <div className={css.deliveryFields}>
              <div className={css.fieldsGrid}>
                <NameInput
                  id="recipient-name"
                  name="recipientName"
                  value={recipientNameValue}
                  error={nameError}
                  isTouched
                  onChange={onRecipientNameChange}
                />

                <PhoneInput
                  id="recipient-phone"
                  name="recipientPhone"
                  value={recipientPhoneValue}
                  error={phoneError}
                  isTouched
                  onChange={onRecipientPhoneChange}
                />

                <div className={css.fieldWide}>
                  <AddressInput
                    id="delivery-address"
                    name="deliveryAddress"
                    value={deliveryAddressValue}
                    error={addressError}
                    isTouched
                    onChange={onDeliveryAddressChange}
                  />
                </div>
              </div>

              <div className={css.deliveryNotes}>
                <div className={css.noteCard}>
                  <Truck size={18} aria-hidden="true" />
                  <p>
                    After confirmation, the pharmacy will contact you to confirm
                    or clarify the delivery address.
                  </p>
                </div>

                <div className={css.noteCardAccent}>
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
  );
}

export default CheckoutDeliveryMethod;
