'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@e-pharmacy/ui/primitives';

import CatalogCardSkeleton from '@/components/catalog/CatalogCardSkeleton/CatalogCardSkeleton';

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

  if (compact) {
    return (
      <div
        className={css.compact}
        role="region"
        aria-live="polite"
        aria-label={`${label} section unavailable`}
      >
        <CatalogCardSkeleton
          count={6}
          label={`Loading ${label}`}
          className={css.compactSkeleton}
        />

        <div className={css.compactNotice}>
          <div className={css.message}>
            <strong>This section is temporarily unavailable.</strong>
            <span>The catalog is taking longer than usual to respond.</span>
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
      </div>
    );
  }

  return (
    <div
      className={css.panel}
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
