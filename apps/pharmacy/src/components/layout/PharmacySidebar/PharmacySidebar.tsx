import Link from 'next/link';

import { Logo } from '@e-pharmacy/ui/common';

import { PHARMACY_NAVIGATION } from '@/lib/pharmacy/navigation';
import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import { PharmacyBadge } from '@/components/layout/PharmacyBadge';
import { PharmacyLogoutButton } from '@/components/layout/PharmacyLogoutButton';
import { PharmacyNavLink } from '@/components/layout/PharmacyNavLink';

import css from './PharmacySidebar.module.css';

//===================================================================

export function PharmacySidebar() {
  return (
    <aside className={css.sidebar} aria-label="Pharmacy navigation">
      <div className={css.brand}>
        <Logo
          href={getPharmacyDashboardPath()}
          label="E-PHARMACY"
          ariaLabel="E-PHARMACY pharmacy dashboard"
          renderLink={({ href, className, children, ...props }) => (
            <Link href={href} className={className} {...props}>
              {children}
            </Link>
          )}
        />
        <PharmacyBadge />
      </div>

      <nav className={css.nav} aria-label="Main pharmacy pages">
        {PHARMACY_NAVIGATION.map((item) => (
          <PharmacyNavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className={css.footer}>
        <PharmacyLogoutButton />
      </div>
    </aside>
  );
}
