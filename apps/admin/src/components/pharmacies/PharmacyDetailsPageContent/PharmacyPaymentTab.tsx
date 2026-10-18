import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { PharmacyPaymentFields } from '@e-pharmacy/ui/profile';

import { buildAdminPaymentRows } from './pharmacy-about-payment';

import css from './PharmacyDetailSections.module.css';

//===================================================================

export function PharmacyPaymentTab({
  detail,
}: Readonly<{ detail: AdminPharmacyDetail }>) {
  const { current, pendingChanges: pending } = detail;
  const bank = current.bankDetails;

  const rows = buildAdminPaymentRows(bank, pending?.bankDetails).filter(
    (row) => row.submitted !== undefined
  );

  return (
    <div className={css.stack}>
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
      {pending?.bankDetails !== undefined ? (
        <section className={css.pendingSection}>
          <h4>Submitted payment changes · Pending review</h4>
          <p className={css.muted}>
            These fields are pending approval and do not replace published
            payment details.
          </p>

          <dl className={css.details}>
            {rows.map((row) => (
              <div className={css.field} key={row.key}>
                <dt>{row.label}</dt>
                <dd className={css.comparison}>
                  <span>
                    <small>Published</small>
                    {row.published}
                  </span>
                  <span>
                    <small>Submitted</small>
                    {row.submitted}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
