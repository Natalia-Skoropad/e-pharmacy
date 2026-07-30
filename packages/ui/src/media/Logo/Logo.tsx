import type { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import SvgIcon from '../../primitives/SvgIcon/SvgIcon';

import css from './Logo.module.css';

//===================================================================

export type LogoVariant = 'green' | 'white';
export type LogoSize = 'sm' | 'md';

//===================================================================

type LogoLinkRenderProps = {
  href: string;
  className: string;
  children: ReactNode;
  'aria-label': string;
};

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
  renderLink?: (props: LogoLinkRenderProps) => ReactNode;
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
  renderLink,
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

  if (renderLink) {
    return renderLink({
      href,
      className: classNames,
      children: content,
      'aria-label': accessibleLabel,
    });
  }

  return (
    <Link className={classNames} href={href} aria-label={accessibleLabel}>
      {content}
    </Link>
  );
}

export default Logo;
export { Logo };
