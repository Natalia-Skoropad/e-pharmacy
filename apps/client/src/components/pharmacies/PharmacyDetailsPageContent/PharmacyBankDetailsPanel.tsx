'use client';

import { Button, CopyButton } from '@e-pharmacy/ui/primitives';

import type { PharmacyBankDetailsState } from './pharmacy-bank-details-state';

import css from './PharmacyBankDetailsPanel.module.css';

//===================================================================

export type PharmacyBankDetailsPanelProps = Readonly<{
  state: PharmacyBankDetailsState;
  onRetry: () => void;
  onCopy: (value: string, label: string) => Promise<boolean>;
}>;

//===================================================================

export function PharmacyBankDetailsPanel({
  state,
  onRetry,
  onCopy,
}: PharmacyBankDetailsPanelProps) {
  return (
    <div className={css.panel}>
      <div className={css.header}>
        <h2 className={css.title}>Bank details</h2>
      </div>

      {state.status === 'idle' || state.status === 'loading' ? (
        <p className={css.notice} role="status">
          Loading bank details...
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className={css.errorState}>
          <p className={css.notice}>
            Bank details are temporarily unavailable. Please try again.
          </p>

          <Button type="button" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {state.status === 'empty' ? (
        <p className={css.notice}>
          Bank details are not available for this pharmacy yet.
        </p>
      ) : null}

      {state.status === 'success' ? (
        <dl className={css.list}>
          {[
            ['Recipient name', state.data.recipientName],
            ['Tax ID / EDRPOU', state.data.taxId],
            ['IBAN', state.data.iban],
            ['Bank name', state.data.bankName],
            ['Payment purpose', state.data.paymentPurpose],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <span>{value}</span>
                <CopyButton
                  label={`Copy ${label} ${value}`}
                  onClick={() => void onCopy(value, label)}
                />
              </dd>
            </div>
          ))}

          <div>
            <dt>Receipt email</dt>
            <dd>
              <a href={`mailto:${state.data.receiptEmail}`}>
                {state.data.receiptEmail}
              </a>
              <CopyButton
                label={`Copy receipt email ${state.data.receiptEmail}`}
                onClick={() =>
                  void onCopy(state.data.receiptEmail, 'Receipt email')
                }
              />
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
