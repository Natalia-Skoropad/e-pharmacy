import type { ProductRequestNavigationCounts } from '@/providers/AdminProductRequestNavigationBadgeProvider';

import css from '../PharmacyNavigationBadges/PharmacyNavigationBadges.module.css';

//===================================================================

const STATUSES = [
  { key: 'new', label: 'New', className: css.new },
  { key: 'onModeration', label: 'On moderation', className: css.moderation },
] as const;

//===================================================================

export function ProductRequestNavigationBadges({
  counts,
  collapsed = false,
}: Readonly<{
  counts: ProductRequestNavigationCounts | null;
  collapsed?: boolean;
}>) {
  if (!counts) return null;

  const visible = STATUSES.filter(({ key }) => counts[key] > 0);

  if (!visible.length) return null;

  if (collapsed) {
    return (
      <span
        className={css.collapsedBadges}
        aria-label={visible
          .map(({ key, label }) => `${counts[key]} product requests: ${label}`)
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
    <span className={`${css.badges} ${css.productRequestBadges}`}>
      {visible.map(({ key, label, className }) => (
        <span
          key={key}
          className={`${css.badge} ${css.productRequestBadge} ${className}`}
          aria-label={`${counts[key]} product requests: ${label}`}
          title={`${label}: ${counts[key]}`}
        >
          {counts[key] > 99 ? '99+' : counts[key]}
        </span>
      ))}
    </span>
  );
}
