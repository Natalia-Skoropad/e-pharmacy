'use client';

import { useId, type ReactNode } from 'react';

//===================================================================

export type CatalogCardHeadingLevel = 2 | 3;

//===================================================================

export type CatalogCardHeadingProps = Readonly<{
  level: CatalogCardHeadingLevel;
  id: string;
  className?: string;
  children: ReactNode;
}>;

//===================================================================

export function useCatalogCardTitleId(): string {
  return `${useId()}-title`;
}

//===================================================================

export function CatalogCardHeading({
  level,
  id,
  className,
  children,
}: CatalogCardHeadingProps) {
  const Heading = level === 3 ? 'h3' : 'h2';

  return (
    <Heading className={className} id={id}>
      {children}
    </Heading>
  );
}
