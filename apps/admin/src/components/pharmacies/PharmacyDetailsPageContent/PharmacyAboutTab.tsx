import { FileText } from 'lucide-react';

import { MarkdownContent } from '@e-pharmacy/ui/data-display';
import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';

import css from './PharmacyDetailSections.module.css';

//===================================================================

function Description({ value }: { value: string | null | undefined }) {
  return value?.trim() ? (
    <MarkdownContent value={value} />
  ) : (
    <p className={css.empty}>No pharmacy description provided.</p>
  );
}

//===================================================================

export function PharmacyAboutTab({
  detail,
}: Readonly<{ detail: AdminPharmacyDetail }>) {
  const { current, pendingChanges: pending } = detail;
  const hasSubmittedDescription = pending?.description !== undefined;

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

        <div className={css.descriptionPanel}>
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
    </div>
  );
}
