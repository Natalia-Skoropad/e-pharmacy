import type { ReactNode } from 'react';
import { RotateCcw, SearchX } from 'lucide-react';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import type { CatalogResourceState } from '@/lib/catalog/catalog-resource-state';

import CatalogAutoRecovery from '@/components/catalog/CatalogAutoRecovery/CatalogAutoRecovery';
import type { CatalogCardSkeletonVariant } from '@/components/catalog/CatalogCardSkeleton/CatalogCardSkeleton';

import css from './CatalogResourceState.module.css';

//===================================================================

export type CatalogResourceStateProps = Readonly<{
  state: CatalogResourceState;
  emptyTitle: string;
  emptyMessage: string;
  unavailableMessage: string;
  unavailableRecoveryHref?: string;
  recoveryLabel?: string;
  skeletonVariant?: CatalogCardSkeletonVariant;
  emptyVariant?: 'default' | 'resource';
  children: ReactNode;
}>;

//===================================================================

function CatalogResourceStateView({
  state,
  emptyTitle,
  emptyMessage,
  unavailableMessage,
  unavailableRecoveryHref,
  recoveryLabel = 'catalog results',
  skeletonVariant = 'product',
  emptyVariant = 'default',
  children,
}: CatalogResourceStateProps) {
  if (state.status === 'unavailable') {
    // Server-side failures must not look like an infinite loading skeleton.
    // The explicit recovery href forces a fresh request after a timeout.
    if (unavailableRecoveryHref) {
      return (
        <ProfileResourceState
          variant="error"
          title="Catalog temporarily unavailable"
          description={unavailableMessage}
          action={
            <a className={css.retryLink} href={unavailableRecoveryHref}>
              <RotateCcw size={16} aria-hidden="true" />
              <span>Try again</span>
            </a>
          }
        />
      );
    }

    return (
      <div className={css.recovery}>
        <CatalogAutoRecovery label={recoveryLabel} variant={skeletonVariant} />
        <p className="visually-hidden">{unavailableMessage}</p>
      </div>
    );
  }

  if (state.status === 'empty') {
    if (emptyVariant === 'resource') {
      return (
        <ProfileResourceState
          variant="empty"
          title={emptyTitle}
          description={emptyMessage}
          icon={<SearchX size={22} />}
        />
      );
    }

    return (
      <div className={css.empty}>
        <h2 className={css.emptyTitle}>{emptyTitle}</h2>
        <p className={css.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return children;
}

export default CatalogResourceStateView;
