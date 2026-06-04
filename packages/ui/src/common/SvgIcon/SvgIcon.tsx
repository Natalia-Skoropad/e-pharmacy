import type { SVGProps } from 'react';

import { cn } from '@e-pharmacy/utils/classes';

import css from './SvgIcon.module.css';

//===================================================================

type SvgIconProps = {
  name: string;
  size?: number;
  className?: string;
  title?: string;
  spriteHref?: string;
} & Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'children'>;

//===================================================================

function SvgIcon({
  name,
  size = 24,
  className,
  title,
  spriteHref = '/icons/sprite.svg',
  'aria-hidden': ariaHidden,
  ...props
}: SvgIconProps) {
  const isHidden = ariaHidden ?? (title ? undefined : true);

  return (
    <svg
      className={cn(css.icon, className)}
      width={size}
      height={size}
      aria-hidden={isHidden}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <use href={`${spriteHref}#${name}`} />
    </svg>
  );
}

export default SvgIcon;
