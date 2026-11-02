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
      <PharmacyReviewSummary detail={detail} section="about" />

      <PharmacyAboutFields value={current.description ?? ''} disabled />
    </div>
  );
}
