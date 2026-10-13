import { History } from 'lucide-react';

import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';

import type { ActivityUrlState } from '@/lib/audit/admin-activity-url';

import { ActivityHistory } from '@/components/activity/ActivityHistory';

import css from './PharmacyDetailsPageContent.module.css';

//===================================================================

/** Only this pharmacy's audit trail is fetched when the Activity tab mounts. */
export function PharmacyActivityTab({
  pharmacyId,
  initialState,
}: Readonly<{
  pharmacyId: string;
  initialState?: ActivityUrlState;
}>) {
  return (
    <section
      className={css.activitySection}
      aria-labelledby="pharmacy-activity-history-title"
    >
      <ProfileSectionHeader
        title="Activity history"
        titleId="pharmacy-activity-history-title"
        description="Review changes made to this pharmacy, including profile updates, moderation decisions and private Admin comment events. Other pharmacies belonging to the same owner are excluded."
        icon={<History size={22} aria-hidden="true" />}
      />

      <ActivityHistory
        scopePharmacyId={pharmacyId}
        initialState={initialState}
      />
    </section>
  );
}
