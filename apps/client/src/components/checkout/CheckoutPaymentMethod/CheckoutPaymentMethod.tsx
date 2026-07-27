import { Copy, CreditCard, Mail, Wallet } from 'lucide-react';

import { PAYMENT_METHOD_LABELS } from '@e-pharmacy/config/presentation';
import { RadioOption } from '@e-pharmacy/ui/forms';
import type { PublicPaymentBankDetails } from '@e-pharmacy/types/pharmacies';
import type { PaymentMethod } from '@e-pharmacy/types/orders';

import css from './CheckoutPaymentMethod.module.css';

//===================================================================

type PaymentMethodProps = {
  paymentMethod: PaymentMethod;
  bankDetails: PublicPaymentBankDetails | null;
  pharmacyEmail: string;
  copiedEmail: boolean;
  disabled?: boolean;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onCopyEmail: () => void;
};

//===================================================================

function CheckoutPaymentMethod({
  paymentMethod,
  bankDetails,
  pharmacyEmail,
  copiedEmail,
  disabled = false,
  onPaymentMethodChange,
  onCopyEmail,
}: PaymentMethodProps) {
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
              <CreditCard size={20} aria-hidden="true" />
              <h3 className={css.infoTitle}>Bank details</h3>

              {bankDetails ? (
                <dl className={css.bankList}>
                  <div>
                    <dt>Recipient</dt>
                    <dd>{bankDetails.recipientName}</dd>
                  </div>

                  <div>
                    <dt>EDRPOU / Tax ID</dt>
                    <dd>{bankDetails.taxId}</dd>
                  </div>

                  <div>
                    <dt>IBAN</dt>
                    <dd>{bankDetails.iban}</dd>
                  </div>

                  <div>
                    <dt>Bank</dt>
                    <dd>{bankDetails.bankName}</dd>
                  </div>

                  <div>
                    <dt>Payment purpose</dt>
                    <dd>{bankDetails.paymentPurpose}</dd>
                  </div>
                </dl>
              ) : (
                <p className={css.mutedText}>
                  Bank transfer is unavailable because the pharmacy has not
                  provided bank details yet.
                </p>
              )}

              {bankDetails && pharmacyEmail ? (
                <div className={css.emailNote}>
                  <Mail size={18} aria-hidden="true" />
                  <p>
                    After payment, send the receipt to the pharmacy email for
                    faster processing.
                  </p>
                  <button
                    className={css.copyButton}
                    type="button"
                    disabled={disabled || !pharmacyEmail}
                    onClick={onCopyEmail}
                  >
                    <span>{pharmacyEmail}</span>
                    <Copy size={16} aria-hidden="true" />
                  </button>
                  {copiedEmail ? (
                    <span className={css.copiedText}>Copied</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CheckoutPaymentMethod;
