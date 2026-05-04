import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import css from './Container.module.css';

type ContainerOwnProps<TElement extends ElementType> = {
  as?: TElement;
  children: ReactNode;
  className?: string;
};

type ContainerProps<TElement extends ElementType> =
  ContainerOwnProps<TElement> &
    Omit<ComponentPropsWithoutRef<TElement>, keyof ContainerOwnProps<TElement>>;

function Container<TElement extends ElementType = 'div'>({
  as,
  children,
  className,
  ...props
}: ContainerProps<TElement>) {
  const Component = as || 'div';

  return (
    <Component className={cn(css.container, className)} {...props}>
      {children}
    </Component>
  );
}

export default Container;
