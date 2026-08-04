'use client';

import { useEffect } from 'react';

import css from './CatalogAutoRecovery.module.css';

//===================================================================

const REFRESH_DELAY_MS = 3_500;

//===================================================================

export type CatalogAutoRecoveryProps = Readonly<{
  label: string;
  compact?: boolean;
}>;

//===================================================================

function CatalogAutoRecovery({
  label,
  compact = false,
}: CatalogAutoRecoveryProps) {
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      window.location.reload();
    }, REFRESH_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <div
      className={compact ? css.compact : css.panel}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${label}`}
    >
      <span className={css.spinner} aria-hidden="true" />
      <span>Loading {label}…</span>
    </div>
  );
}

export default CatalogAutoRecovery;
