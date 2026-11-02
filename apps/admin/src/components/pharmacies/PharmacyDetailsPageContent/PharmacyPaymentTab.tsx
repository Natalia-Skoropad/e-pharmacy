import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { PharmacyPaymentFields } from '@e-pharmacy/ui/profile';

import { PharmacyReviewSummary } from './PharmacyReviewSummary';

import css from './PharmacyDetailSections.module.css';

//===================================================================

export function PharmacyPaymentTab({
  detail,
}: Readonly<{ detail: AdminPharmacyDetail }>) {
  const { current } = detail;
  const bank = current.bankDetails;

  return (
    <div className={css.stack}>
      <PharmacyReviewSummary detail={detail} section="payment" />

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
    </div>
  );
}
