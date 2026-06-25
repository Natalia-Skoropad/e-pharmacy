'use client';

import { usePathname } from 'next/navigation';

import { SideMenu } from '@e-pharmacy/ui/layout';

import { PHARMACY_NAVIGATION } from '@/lib/pharmacy/navigation';

import css from './PharmacySidebar.module.css';

//===================================================================

export function PharmacySidebar() {
  const pathname = usePathname();

  return (
    <aside className={css.sidebar} aria-label="Pharmacy cabinet sections">
      <SideMenu
        items={PHARMACY_NAVIGATION}
        activePath={pathname}
        ariaLabel="Pharmacy navigation"
      />
    </aside>
  );
}
