import type { ReactNode } from 'react';

import css from './CatalogGrid.module.css';

//===================================================================

export type CatalogGridProps = Readonly<{
  children: ReactNode;
  ariaLabel: string;
}>;

//===================================================================

export type CatalogGridItemProps = Readonly<{ children: ReactNode }>;

//===================================================================

function CatalogGridRoot({ children, ariaLabel }: CatalogGridProps) {
  return (
    <div className={css.list} role="list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

//===================================================================

function CatalogGridItem({ children }: CatalogGridItemProps) {
  return (
    <div className={css.item} role="listitem">
      {children}
    </div>
  );
}

//===================================================================

const CatalogGrid = Object.assign(CatalogGridRoot, { Item: CatalogGridItem });

//===================================================================

export default CatalogGrid;
