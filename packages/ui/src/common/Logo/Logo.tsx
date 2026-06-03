import Link from 'next/link';

import SvgIcon from '../SvgIcon';

import { cn } from '../../utils/classNames';

import css from './Logo.module.css';

//===================================================================

type LogoVariant = 'green' | 'white';

type LogoProps = {
  className?: string;
  variant?: LogoVariant;
  href?: string;
  label?: string;
  iconName?: string;
};

//===================================================================

function Logo({
  className,
  variant = 'green',
  href = '/',
  label = 'E-PHARMACY',
  iconName = 'icon-logo',
}: LogoProps) {
  return (
    <Link
      className={cn(css.logo, css[variant], className)}
      href={href}
      aria-label={`${label} home`}
    >
      <span className={css.iconWrap} aria-hidden="true">
        <SvgIcon name={iconName} size={22} />
      </span>

      <span className={css.text}>{label}</span>
    </Link>
  );
}

export default Logo;
