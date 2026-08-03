'use client';

import { Button } from '@e-pharmacy/ui/primitives';

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
          <div>
            <dt>Recipient name</dt>
            <dd>{state.data.recipientName}</dd>
          </div>

          <div>
            <dt>Tax ID / EDRPOU</dt>
            <dd>{state.data.taxId}</dd>
          </div>

          <div>
            <dt>IBAN</dt>
            <dd>
              <button
                className={css.copyValueButton}
                type="button"
                onClick={() => void onCopy(state.data.iban, 'IBAN')}
                aria-label={`Copy IBAN ${state.data.iban}`}
              >
                {state.data.iban}
              </button>
            </dd>
          </div>

          <div>
            <dt>Bank name</dt>
            <dd>{state.data.bankName}</dd>
          </div>

          <div>
            <dt>Payment purpose</dt>
            <dd>{state.data.paymentPurpose}</dd>
          </div>

          <div>
            <dt>Receipt email</dt>
            <dd>
              <a href={`mailto:${state.data.receiptEmail}`}>
                {state.data.receiptEmail}
              </a>
              <button
                className={css.copyActionButton}
                type="button"
                onClick={() =>
                  void onCopy(state.data.receiptEmail, 'Receipt email')
                }
                aria-label={`Copy receipt email ${state.data.receiptEmail}`}
              >
                Copy
              </button>
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
