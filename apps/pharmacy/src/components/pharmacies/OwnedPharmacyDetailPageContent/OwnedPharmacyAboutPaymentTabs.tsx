'use client';

import type {
  MyPharmacyProfile,
  EditablePharmacyBankDetails,
} from '@e-pharmacy/types/pharmacies';

import { MarkdownContent } from '@e-pharmacy/ui/data-display';

import {
  PharmacyAboutFields,
  PharmacyPaymentFields,
  ProfileResourceState,
} from '@e-pharmacy/ui/profile';

import { Field, show } from './detail-fields';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

export function About({ pharmacy }: { pharmacy: MyPharmacyProfile }) {
  return (
    <div className={css.formStack}>
      <PharmacyAboutFields value={pharmacy.description ?? ''} disabled />

      {pharmacy.pendingModeration?.description !== undefined && (
        <section className={css.pendingSection}>
          <h3>Submitted description · Pending review</h3>

          <p className={css.muted}>
            The proposal does not replace the published description until
            approved.
          </p>
          {pharmacy.pendingModeration.description?.trim() ? (
            <MarkdownContent value={pharmacy.pendingModeration.description} />
          ) : (
            <p>The submitted change will clear the description.</p>
          )}
        </section>
      )}
    </div>
  );
}

//===================================================================

export function Payment({ pharmacy }: { pharmacy: MyPharmacyProfile }) {
  if (pharmacy.membershipRole !== 'owner')
    return (
      <ProfileResourceState
        variant="empty"
        title="Payment details are private"
        description="Only the pharmacy owner can view bank details."
      />
    );

  const bank = pharmacy.bankDetails;

  const published: Record<
    keyof EditablePharmacyBankDetails,
    string | undefined
  > = {
    recipientName: bank?.recipientName,
    taxId: bank?.taxId,
    iban: bank?.iban,
    bankName: bank?.bankName,
    receiptEmail: bank?.receiptEmail,
    paymentPurpose: bank?.paymentPurpose,
  };

  return (
    <div className={css.formStack}>
      <PharmacyPaymentFields
        disabled
        values={{
          recipientName: bank?.recipientName ?? '',
          taxId: bank?.taxId ?? '',
          iban: bank?.iban ?? '',
          bankName: bank?.bankName ?? '',
          receiptEmail: bank?.receiptEmail ?? '',
          paymentPurpose: bank?.paymentPurpose ?? '',
        }}
      />
      {pharmacy.pendingModeration?.bankDetails && (
        <section className={css.pendingSection}>
          <h3>Submitted payment changes · Pending review</h3>
          <p className={css.muted}>
            Approved details remain unchanged until moderation.
          </p>

          <dl className={css.details}>
            {Object.entries(pharmacy.pendingModeration.bankDetails).map(
              ([key, value]) => (
                <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}>
                  <span className={css.comparisonLabels}>
                    Published:{' '}
                    {show(published[key as keyof EditablePharmacyBankDetails])}
                  </span>

                  <span className={css.comparisonLabels}>
                    Submitted: {show(value)}
                  </span>
                </Field>
              )
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
