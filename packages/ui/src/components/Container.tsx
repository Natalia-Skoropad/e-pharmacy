import type { ElementType, HTMLAttributes, ReactNode } from 'react';

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
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}
