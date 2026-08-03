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
    <ul className={css.list} aria-label={ariaLabel}>
      {children}
    </ul>
  );
}

//===================================================================

function CatalogGridItem({ children }: CatalogGridItemProps) {
  return <li className={css.item}>{children}</li>;
}

//===================================================================

const CatalogGrid = Object.assign(CatalogGridRoot, { Item: CatalogGridItem });

//===================================================================

export default CatalogGrid;
