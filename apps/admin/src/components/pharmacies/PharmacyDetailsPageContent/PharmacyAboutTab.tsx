import { PharmacyAboutFields } from '@e-pharmacy/ui/profile';
import { MarkdownContent } from '@e-pharmacy/ui/data-display';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';

import css from './PharmacyDetailSections.module.css';

//===================================================================

export function PharmacyAboutTab({
  detail,
}: Readonly<{ detail: AdminPharmacyDetail }>) {
  const { current, pendingChanges: pending } = detail;

  return (
    <div className={css.stack}>
      <PharmacyAboutFields value={current.description ?? ''} disabled />

      {pending?.description !== undefined ? (
        <section className={css.pendingSection}>
          <h4>Submitted description · Pending review</h4>
          <p className={css.muted}>
            The proposal does not replace the published description until
            approved.
          </p>

          {pending.description?.trim() ? (
            <MarkdownContent value={pending.description} />
          ) : (
            <p className={css.empty}>
              The submitted change will clear the description.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
