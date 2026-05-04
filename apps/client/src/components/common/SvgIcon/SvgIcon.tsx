import type { SVGProps } from 'react';

import { ASSETS } from '@/lib/constants/assets';
import { cn } from '@/lib/utils';

import css from './SvgIcon.module.css';

//===================================================================

type SvgIconProps = {
  name: string;
  size?: number;
  className?: string;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'children'>;

//===================================================================

function SvgIcon({
  name,
  size = 24,
  className,
  title,
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
      <use href={`${ASSETS.iconsSprite}#${name}`} />
    </svg>
  );
}

export default SvgIcon;
