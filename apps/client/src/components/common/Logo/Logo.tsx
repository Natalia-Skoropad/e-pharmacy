import Link from 'next/link';

import SvgIcon from '@/components/common/SvgIcon';

import { ROUTES } from '@/lib/constants/routes';
import { SITE_NAME } from '@/lib/constants/metadata';
import { cn } from '@/lib/utils';

import css from './Logo.module.css';

//===================================================================

type LogoProps = {
  className?: string;
};

//===================================================================

function Logo({ className }: LogoProps) {
  return (
    <Link className={cn(css.logo, className)} href={ROUTES.HOME}>
      <span className={css.iconWrap} aria-hidden="true">
        <SvgIcon name="icon-logo-cross" size={18} />
      </span>

      <span className={css.text}>{SITE_NAME}</span>
    </Link>
  );
}

export default Logo;
