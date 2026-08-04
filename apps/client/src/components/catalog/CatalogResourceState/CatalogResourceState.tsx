import type { ReactNode } from 'react';

import CatalogAutoRecovery from '@/components/catalog/CatalogAutoRecovery/CatalogAutoRecovery';

import css from './CatalogResourceState.module.css';

import type { CatalogResourceState } from '@/lib/catalog/catalog-resource-state';

//===================================================================

export type CatalogResourceStateProps = Readonly<{
  state: CatalogResourceState;
  emptyTitle: string;
  emptyMessage: string;
  unavailableMessage: string;
  recoveryLabel?: string;
  children: ReactNode;
}>;

//===================================================================

function CatalogResourceStateView({
  state,
  emptyTitle,
  emptyMessage,
  unavailableMessage,
  recoveryLabel = 'catalog results',
  children,
}: CatalogResourceStateProps) {
  if (state.status === 'unavailable') {
    return (
      <div className={css.recovery}>
        <CatalogAutoRecovery label={recoveryLabel} />
        <p className="visually-hidden">{unavailableMessage}</p>
      </div>
    );
  }

  if (state.status === 'empty') {
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
