import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import clsx from 'clsx';

import css from './Container.module.css';

//===================================================================

export type ContainerVariant = 'page' | 'wide' | 'fluid';

export type ContainerOwnProps<TElement extends ElementType> = {
  as?: TElement;
  children: ReactNode;
  variant?: ContainerVariant;
  className?: string;
};

export type ContainerProps<TElement extends ElementType> =
  ContainerOwnProps<TElement> &
    Omit<ComponentPropsWithoutRef<TElement>, keyof ContainerOwnProps<TElement>>;

//===================================================================

function Container<TElement extends ElementType = 'div'>({
  as,
  children,
  variant = 'page',
  className,
  ...props
}: ContainerProps<TElement>) {
  const Component = as || 'div';

  return (
    <Component
      className={clsx(css.container, css[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Container;

export { Container };
