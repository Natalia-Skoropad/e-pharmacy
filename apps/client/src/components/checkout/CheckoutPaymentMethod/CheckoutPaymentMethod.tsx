import { Wallet } from 'lucide-react';

import { PAYMENT_METHOD_LABELS } from '@e-pharmacy/config/presentation';
import { RadioOption } from '@e-pharmacy/ui/forms';
import { CopyButton } from '@e-pharmacy/ui/primitives';
import type { PublicPaymentBankDetails } from '@e-pharmacy/types/pharmacies';
import type { PaymentMethod } from '@e-pharmacy/types/orders';

import css from './CheckoutPaymentMethod.module.css';

//===================================================================

type PaymentMethodProps = {
  paymentMethod: PaymentMethod;
  bankDetails: PublicPaymentBankDetails | null;
  disabled?: boolean;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onCopy: (value: string, label: string) => Promise<boolean>;
};

//===================================================================

function CheckoutPaymentMethod({
  paymentMethod,
  bankDetails,
  disabled = false,
  onPaymentMethodChange,
  onCopy,
}: PaymentMethodProps) {
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
    <section className={css.card} aria-labelledby="payment-title">
      <h2 className={css.title} id="payment-title">
        Payment method
      </h2>

      <div className={css.choiceGrid}>
        <fieldset className={css.optionsGrid} disabled={disabled}>
          <legend className="visually-hidden">Payment method</legend>

          <RadioOption
            name="payment"
            value="cash"
            checked={paymentMethod === 'cash'}
            label={PAYMENT_METHOD_LABELS.cash}
            disabled={disabled}
            onChange={onPaymentMethodChange}
          />

          <RadioOption
            name="payment"
            value="bank_transfer"
            checked={paymentMethod === 'bank_transfer'}
            label={PAYMENT_METHOD_LABELS.bank_transfer}
            disabled={disabled || !bankDetails}
            onChange={onPaymentMethodChange}
          />
        </fieldset>

        <div className={css.detailsPanel}>
          {paymentMethod === 'cash' ? (
            <div className={css.infoCard}>
              <Wallet size={20} aria-hidden="true" />
              <h3 className={css.infoTitle}>Pay when everything is ready</h3>
              <p className={css.mutedText}>
                Cash is paid during pickup or delivery. Please keep the order
                amount ready when you receive the order.
              </p>
            </div>
          ) : (
            <div className={css.bankCard}>
              <h3 className={css.infoTitle}>Bank details</h3>

              {bankDetails ? (
                <>
                  <dl className={css.bankList}>
                    {bankRows.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>
                          <span>{value}</span>
                          <CopyButton
                            label={`Copy ${label} ${value}`}
                            disabled={disabled}
                            onClick={() => void onCopy(value, label)}
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <p className={css.emailNote}>
                    After payment, send the receipt to the pharmacy email for
                    faster processing.
                  </p>
                </>
              ) : (
                <p className={css.mutedText}>
                  Bank transfer is unavailable because the pharmacy has not
                  provided bank details yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CheckoutPaymentMethod;
