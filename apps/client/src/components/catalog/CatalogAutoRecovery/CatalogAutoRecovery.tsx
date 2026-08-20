'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@e-pharmacy/ui/primitives';

import css from './CatalogAutoRecovery.module.css';

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
  const router = useRouter();

  const handleRetry = () => {
    router.refresh();
  };

  return (
    <div
      className={compact ? css.compact : css.panel}
      role="region"
      aria-live="polite"
      aria-label={`${label} section unavailable`}
    >
      <div className={css.message}>
        <strong>This section is temporarily unavailable.</strong>
        <span>Try again when the catalog service is ready.</span>
      </div>

      <Button
        className={css.retryButton}
        type="button"
        variant="secondary"
        size="sm"
        iconLeft={<RefreshCw size={17} aria-hidden="true" />}
        onClick={handleRetry}
      >
        Try again
      </Button>
    </div>
  );
}

export default CatalogAutoRecovery;
