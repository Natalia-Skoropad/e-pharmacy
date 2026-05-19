import Link from 'next/link';

import SvgIcon from '@/components/common/SvgIcon';

import { ROUTES } from '@/lib/constants/routes';
import { SITE_NAME } from '@/lib/constants/metadata';
import { cn } from '@/lib/utils';

import css from './Logo.module.css';

//===================================================================

type LogoVariant = 'green' | 'white';

type LogoProps = {
  className?: string;
  variant?: LogoVariant;
};

//===================================================================

function Logo({ className, variant = 'green' }: LogoProps) {
  return (
    <Link
      className={cn(css.logo, css[variant], className)}
      href={ROUTES.HOME}
      aria-label={`${SITE_NAME} home`}
    >
      <span className={css.iconWrap} aria-hidden="true">
        <SvgIcon name="icon-logo" size={22} />
      </span>

      <span className={css.text}>{SITE_NAME}</span>
    </Link>
  );
}

export default Logo;
