import Link from 'next/link';
import clsx from 'clsx';

import { INFO_SIDE_MENU_ITEMS } from '@/components/info/config/navigation';

import css from './InfoNavigation.module.css';

//===================================================================

export type InfoNavigationProps = Readonly<{
  activePath: string;
  className?: string;
}>;

//===================================================================

export function InfoNavigation({ activePath, className }: InfoNavigationProps) {
  return (
    <nav
      className={clsx(css.navigation, className)}
      aria-label="Information pages"
    >
      <ul className={css.list}>
        {INFO_SIDE_MENU_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = href === activePath;

          return (
            <li key={href}>
              <Link
                className={clsx(css.link, isActive && css.active)}
                href={href}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
