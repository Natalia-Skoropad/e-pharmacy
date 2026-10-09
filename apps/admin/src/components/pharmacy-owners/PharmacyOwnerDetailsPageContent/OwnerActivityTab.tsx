import { History } from 'lucide-react';

import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';

import type { ActivityUrlState } from '@/lib/audit/admin-activity-url';

import { ActivityHistory } from '@/components/activity/ActivityHistory';

import css from './OwnerResourceTabs.module.css';

//===================================================================

export function OwnerActivityTab({
  ownerId,
  initialState,
}: Readonly<{
  ownerId: string;
  initialState?: ActivityUrlState;
}>) {
  return (
    <section
      className={css.activitySection}
      aria-labelledby="owner-activity-history-title"
    >
      <ProfileSectionHeader
        title="Activity history"
        titleId="owner-activity-history-title"
        description="Review the immutable history of changes related to this pharmacy owner, including owner, document, comment, and linked-pharmacy events."
        icon={<History size={22} />}
      />
      <ActivityHistory scopeOwnerId={ownerId} initialState={initialState} />
    </section>
  );
}
