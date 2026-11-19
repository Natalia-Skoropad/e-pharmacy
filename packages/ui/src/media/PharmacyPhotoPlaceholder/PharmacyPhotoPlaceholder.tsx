import { Building2, ImageOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

import css from './PharmacyPhotoPlaceholder.module.css';

//===================================================================

// A shared visual for pharmacies without an uploaded photo, based on the
// owner details placeholder. Use the same presentation in both cabinets.
export function PharmacyPhotoPlaceholder({
  compact = false,
  icon: Icon = Building2,
  title = 'No pharmacy photo yet',
  description = 'The pharmacy has not uploaded a photo.',
}: Readonly<{
  compact?: boolean;
  icon?: LucideIcon;
  title?: string;
  description?: string;
}>) {
  return (
    <div className={clsx(css.placeholder, compact && css.compact)}>
      <div className={css.visual} aria-hidden="true">
        <span className={css.icon}>
          <Icon size={compact ? 27 : 58} />
        </span>

        <span className={css.badge}>
          <ImageOff size={compact ? 12 : 16} />
        </span>
      </div>

      {!compact ? (
        <div className={css.copy}>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
      ) : null}
    </div>
  );
}
