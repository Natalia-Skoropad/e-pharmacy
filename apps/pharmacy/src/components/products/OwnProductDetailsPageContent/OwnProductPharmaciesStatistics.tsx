import {
  Ban,
  ClipboardCheck,
  Clock3,
  RotateCcw,
  ShieldCheck,
  Store,
} from 'lucide-react';

import type { OwnedPharmacyStatistics } from '@e-pharmacy/types/pharmacies';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';
import { StatsCard, StatsGrid } from '@e-pharmacy/ui/statistics';

import css from './OwnProductPharmaciesTab.module.css';

//===================================================================

const CARDS = [
  { status: 'new', title: 'New', count: 'new', tone: 'blue', icon: Store },
  {
    status: 'on_verification',
    title: 'On verification',
    count: 'onVerification',
    tone: 'purple',
    icon: ClipboardCheck,
  },
  {
    status: 'active',
    title: 'Active',
    count: 'active',
    tone: 'green',
    icon: ShieldCheck,
  },
  {
    status: 'on_moderation',
    title: 'On moderation',
    count: 'onModeration',
    tone: 'orange',
    icon: Clock3,
  },
  {
    status: 'on_reactivation',
    title: 'Reactivation requested',
    count: 'onReactivation',
    tone: 'mustard',
    icon: RotateCcw,
  },
  {
    status: 'blocked',
    title: 'Blocked',
    count: 'blocked',
    tone: 'red',
    icon: Ban,
  },
] as const;

//===================================================================

/** Uses the same six pharmacy lifecycle metrics as /pharmacy/pharmacies. */
export function OwnProductPharmaciesStatistics({
  counts,
  activeStatus,
  onStatusChange,
}: Readonly<{
  counts: OwnedPharmacyStatistics;
  activeStatus: PharmacyStatus | 'all';
  onStatusChange: (value: PharmacyStatus | 'all') => void;
}>) {
  return (
    <StatsGrid
      columns={3}
      tabletColumns={3}
      ariaLabel="Pharmacy status statistics"
    >
      {CARDS.map(({ status, title, count, tone, icon: Icon }) => (
        <StatsCard
          key={status}
          title={title}
          value={counts[count]}
          tone={tone}
          icon={<Icon size={26} aria-hidden="true" />}
          onClick={() =>
            onStatusChange(activeStatus === status ? 'all' : status)
          }
          className={activeStatus === status ? css.activeCard : undefined}
          ariaLabel={
            activeStatus === status
              ? `Clear ${title} filter`
              : `Filter by ${title} pharmacies`
          }
        />
      ))}
    </StatsGrid>
  );
}
