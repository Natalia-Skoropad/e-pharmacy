'use client';

import { Landmark, WalletCards } from 'lucide-react';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { CopyButton } from '@e-pharmacy/ui/primitives';

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
        <span className={css.headerIcon} aria-hidden="true">
          <Landmark size={22} />
        </span>
        <div>
          <h2 className={css.title}>Bank details</h2>
          <p className={css.subtitle}>
            Payment details provided by the pharmacy for bank transfer orders.
          </p>
        </div>
      </div>

      {state.status === 'idle' || state.status === 'loading' ? (
        <ProfileResourceState
          variant="loading"
          title="Loading bank details"
          description="Please wait while the pharmacy payment information is loaded."
        />
      ) : null}

      {state.status === 'error' ? (
        <ProfileResourceState
          variant="error"
          title="Bank details could not be loaded"
          description="The payment information is temporarily unavailable. Try again in a moment."
          retryLabel="Retry"
          onRetry={onRetry}
          sideActionOnDesktop
        />
      ) : null}

      {state.status === 'empty' ? (
        <div className={css.stateCard}>
          <span className={css.stateIcon} aria-hidden="true">
            <WalletCards size={28} />
          </span>
          <div>
            <h3>Bank details are not available yet</h3>
            <p>
              This pharmacy has not published bank transfer details. You can
              still review its contacts and available products in the other
              tabs.
            </p>
          </div>
        </div>
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
