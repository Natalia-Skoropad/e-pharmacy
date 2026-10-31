import { PharmacyAboutFields } from '@e-pharmacy/ui/profile';
import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';

import { PharmacyReviewSummary } from './PharmacyReviewSummary';

import css from './PharmacyDetailSections.module.css';

//===================================================================

export function PharmacyAboutTab({
  detail,
}: Readonly<{ detail: AdminPharmacyDetail }>) {
  const { current } = detail;

  return (
    <div className={css.stack}>
      <PharmacyAboutFields value={current.description ?? ''} disabled />

      <PharmacyReviewSummary detail={detail} section="about" />
    </div>
  );
}
