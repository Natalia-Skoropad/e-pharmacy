import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import styles from './Container.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type ContainerProps<TElement extends ElementType = 'div'> =
  HTMLAttributes<HTMLElement> & {
    as?: TElement;
    children: ReactNode;
  };

//=============================================================================

export function Container<TElement extends ElementType = 'div'>({
  as,
  children,
  className,
  ...props
}: ContainerProps<TElement>) {
  const Component = as ?? 'div';

  return (
    <Component className={joinClassNames(styles.container, className)} {...props}>
      {children}
    </Component>
  );
}
