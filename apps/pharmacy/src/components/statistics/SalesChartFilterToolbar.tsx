'use client';

import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@e-pharmacy/ui/primitives';
import css from './SalesChartFilterToolbar.module.css';

//===================================================================

// Keep the period selectors together and reset all URL-backed chart filters.
export function SalesChartFilterToolbar({
  children,
  hasFilters,
  onReset,
}: Readonly<{
  children: ReactNode;
  hasFilters: boolean;
  onReset: () => void;
}>) {
  return (
    <div className={css.toolbar}>
      {children}
      {hasFilters ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={css.resetButton}
          iconLeft={<RotateCcw size={17} aria-hidden="true" />}
          onClick={onReset}
        >
          Reset filters
        </Button>
      ) : null}
    </div>
  );
}
