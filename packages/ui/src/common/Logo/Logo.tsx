import Link from 'next/link';
import clsx from 'clsx';

import SvgIcon from '../SvgIcon/SvgIcon';

import css from './Logo.module.css';

//===================================================================

export type LogoVariant = 'green' | 'white';
export type LogoSize = 'sm' | 'md';

//===================================================================

export type LogoProps = {
  className?: string;
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string | null;
  label?: string;
  iconName?: string;
  showText?: boolean;
  ariaLabel?: string;
};

//===================================================================

function Logo({
  className,
  variant = 'green',
  size = 'md',
  href = '/',
  label = 'E-PHARMACY',
  iconName = 'icon-logo',
  showText = true,
  ariaLabel,
}: LogoProps) {
  const classNames = clsx(css.logo, css[variant], css[size], className);
  const content = (
    <>
      <span className={css.iconWrap} aria-hidden="true">
        <SvgIcon name={iconName} size={22} />
      </span>

      {showText ? <span className={css.text}>{label}</span> : null}
    </>
  );
  const accessibleLabel = ariaLabel ?? (href ? `${label} home` : label);

  if (!href) {
    return (
      <span className={classNames} aria-label={accessibleLabel}>
        {content}
      </span>
    );
  }

  return (
    <Link className={classNames} href={href} aria-label={accessibleLabel}>
      {content}
    </Link>
  );
}

export default Logo;

export { Logo };
