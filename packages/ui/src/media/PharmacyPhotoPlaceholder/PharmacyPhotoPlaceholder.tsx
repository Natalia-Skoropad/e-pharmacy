import { Building2, ImageOff } from 'lucide-react';
import clsx from 'clsx';

import css from './PharmacyPhotoPlaceholder.module.css';

//===================================================================

// A shared visual for pharmacies without an uploaded photo, based on the
// owner details placeholder. Use the same presentation in both cabinets.
export function PharmacyPhotoPlaceholder({
  compact = false,
}: Readonly<{ compact?: boolean }>) {
  return (
    <div className={clsx(css.placeholder, compact && css.compact)}>
      <div className={css.visual} aria-hidden="true">
        <span className={css.icon}>
          <Building2 size={compact ? 27 : 58} />
        </span>

        <span className={css.badge}>
          <ImageOff size={compact ? 12 : 16} />
        </span>
      </div>

      {!compact ? (
        <div className={css.copy}>
          <strong>No pharmacy photo yet</strong>
          <span>The pharmacy has not uploaded a photo.</span>
        </div>
      ) : null}
    </div>
  );
}
