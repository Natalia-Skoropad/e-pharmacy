import type { PharmacyNavigationCounts } from '@/providers/AdminPharmacyNavigationBadgeProvider';

import css from './PharmacyNavigationBadges.module.css';

//===================================================================

type PharmacyNavigationBadgesProps = Readonly<{
  counts: PharmacyNavigationCounts | null;
  collapsed?: boolean;
}>;

//===================================================================

const STATUSES = [
  { key: 'new', label: 'New', className: css.new },
  {
    key: 'onVerification',
    label: 'On verification',
    className: css.verification,
  },
  { key: 'onModeration', label: 'On moderation', className: css.moderation },
] as const;

//===================================================================

export function PharmacyNavigationBadges({
  counts,
  collapsed = false,
}: PharmacyNavigationBadgesProps) {
  if (!counts) return null;

  const visible = STATUSES.filter(({ key }) => counts[key] > 0);
  if (!visible.length) return null;

  if (collapsed) {
    return (
      <span
        className={css.collapsedBadges}
        aria-label={visible
          .map(
            ({ key, label }) =>
              `${counts[key]} ${label.toLowerCase()} pharmacies`
          )
          .join(', ')}
      >
        {visible.map(({ key, className }) => (
          <span
            key={key}
            className={`${css.dot} ${className}`}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  }

  return (
    <span className={css.badges}>
      {visible.map(({ key, label, className }) => (
        <span
          key={key}
          className={`${css.badge} ${className}`}
          aria-label={`${counts[key]} pharmacies: ${label}`}
          title={`${label}: ${counts[key]}`}
        >
          {counts[key] > 99 ? '99+' : counts[key]}
        </span>
      ))}
    </span>
  );
}
