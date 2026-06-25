import Link from 'next/link';

import { PHARMACY_NAVIGATION } from '@/lib/pharmacy/navigation';
import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import css from './PharmacyShell.module.css';

//===================================================================

type PharmacyShellProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

export function PharmacyShell({ children }: PharmacyShellProps) {
  return (
    <div className={css.shell}>
      <header className={css.header}>
        <Link className={css.logo} href={getPharmacyDashboardPath()}>
          E-PHARMACY
        </Link>
        <span className={css.badge}>Pharmacy</span>
      </header>

      <aside className={css.sidebar} aria-label="Pharmacy navigation">
        <Link className={css.logo} href={getPharmacyDashboardPath()}>
          E-PHARMACY
        </Link>
        <span className={css.badge}>Pharmacy</span>
        <nav className={css.nav} aria-label="Main pharmacy pages">
          {PHARMACY_NAVIGATION.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={css.content}>{children}</div>
    </div>
  );
}
