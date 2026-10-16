import { FileText, Landmark, LockKeyhole, ShieldCheck } from 'lucide-react';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { MarkdownContent } from '@e-pharmacy/ui/data-display';

import {
  buildAdminPaymentRows,
  getMissingPublishedPaymentFields,
  getPublishedPaymentStatus,
} from './pharmacy-about-payment';

import css from './PharmacyAboutPaymentTab.module.css';

//===================================================================

type Props = Readonly<{ detail: AdminPharmacyDetail }>;

//===================================================================

function Description({ value }: { value: string | null | undefined }) {
  return value?.trim() ? (
    <MarkdownContent value={value} />
  ) : (
    <p className={css.empty}>No pharmacy description provided.</p>
  );
}

//===================================================================

/** Read-only Admin content: never merge pending data into published values. */
export function PharmacyAboutPaymentTab({ detail }: Props) {
  const { current } = detail;
  const pending = detail.pendingChanges;
  const hasSubmittedDescription = pending?.description !== undefined;
  const pendingBank = pending?.bankDetails;
  const rows = buildAdminPaymentRows(current.bankDetails, pendingBank);
  const paymentStatus = getPublishedPaymentStatus(detail);
  const missingFields = getMissingPublishedPaymentFields(current.bankDetails);
  const submittedRows = rows.filter((row) => row.submitted !== undefined);

  return (
    <div className={css.stack}>
      <section className={css.card} aria-labelledby="pharmacy-about-title">
        <div className={css.heading}>
          <FileText size={21} aria-hidden="true" />
          <div>
            <h3 id="pharmacy-about-title">About pharmacy</h3>
            <p>
              Approved pharmacy description, visible separately from changes
              awaiting review.
            </p>
          </div>
        </div>

        <div className={css.copySection}>
          <h4>Published description</h4>
          <Description value={current.description} />
        </div>

        {hasSubmittedDescription && (
          <div className={css.pendingSection}>
            <h4>Submitted description · Pending review</h4>

            <p className={css.muted}>
              This proposal does not replace the published description until
              approved.
            </p>

            {pending?.description?.trim() ? (
              <Description value={pending.description} />
            ) : (
              <p className={css.empty}>
                The submitted change will clear the description.
              </p>
            )}

            {current.description === pending?.description && (
              <span className={css.muted}>
                No change to the published description.
              </span>
            )}
          </div>
        )}
      </section>

      <section className={css.card} aria-labelledby="pharmacy-payment-title">
        <div className={css.heading}>
          <Landmark size={21} aria-hidden="true" />
          <div>
            <h3 id="pharmacy-payment-title">Payment details</h3>

            <p>
              Private pharmacy banking information, available to authorized
              administrators only.
            </p>
          </div>
        </div>

        <div className={css.status} role="status">
          <ShieldCheck size={20} aria-hidden="true" />
          <div>
            <strong>
              {paymentStatus === 'available'
                ? 'Bank transfer available'
                : 'Bank transfer unavailable · Incomplete details'}
            </strong>

            <p>
              {paymentStatus === 'available'
                ? 'All required published payment fields are filled in.'
                : missingFields.length
                  ? `Missing published fields: ${missingFields.join(', ')}.`
                  : 'The published payment configuration is not enabled.'}
            </p>
            <p>Only approved payment data determines transfer availability.</p>
          </div>
        </div>

        <div className={css.copySection}>
          <h4>Published payment details</h4>
          <dl className={css.details}>
            {rows.map((row) => (
              <div key={row.key} className={css.field}>
                <dt>{row.label}</dt>
                <dd>
                  <span
                    className={
                      row.published === 'Not provided' ? css.empty : css.value
                    }
                  >
                    {row.published}
                  </span>
                  {row.publishedFormatIssue && (
                    <span className={css.warning}>
                      {row.publishedFormatIssue}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {pendingBank !== undefined && (
          <div className={css.pendingSection}>
            <div className={css.pendingHeading}>
              <h4>Submitted payment changes · Pending review</h4>
              <LockKeyhole size={18} aria-label="Private data" />
            </div>

            <p className={css.muted}>
              Only explicitly submitted fields are compared. Other payment
              fields remain unchanged; submitted values are not active.
            </p>

            {submittedRows.length ? (
              <dl className={css.details}>
                {submittedRows.map((row) => (
                  <div
                    key={row.key}
                    className={`${css.field} ${row.changed ? css.changed : ''}`}
                  >
                    <dt>
                      {row.label} · {row.changed ? 'Changed' : 'Unchanged'}
                    </dt>

                    <dd className={css.comparison}>
                      <span>
                        <small>Published</small>
                        {row.published}
                      </span>

                      <span>
                        <small>Submitted</small>
                        {row.submitted}
                      </span>

                      {row.submittedFormatIssue && (
                        <span className={css.warning}>
                          {row.submittedFormatIssue}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={css.empty}>No payment field changes submitted.</p>
            )}
          </div>
        )}

        <p className={css.footer}>
          <LockKeyhole size={16} aria-hidden="true" />
          Read only. Administrators cannot change owner banking or profile data
          directly; changes require the existing moderation and audit workflow.
        </p>
      </section>
    </div>
  );
}
