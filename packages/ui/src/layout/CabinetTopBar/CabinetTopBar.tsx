import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

import type { BreadcrumbItem } from '@e-pharmacy/types/navigation';

import {
  BreadcrumbTrail,
  type BreadcrumbLinkRenderProps,
} from '../internal/BreadcrumbTrail';

import css from './CabinetTopBar.module.css';

//===================================================================

export type CabinetTopBarProps = Readonly<{
  items: readonly BreadcrumbItem[];
  actions?: ReactNode;
  leadingIcon?: ReactNode;
  navigationToggle?: ReactNode;
  className?: string;
  ariaLabel?: string;
  renderLink?: (props: BreadcrumbLinkRenderProps) => ReactNode;
}>;

//===================================================================

function CabinetTopBar({
  items,
  actions,
  leadingIcon,
  navigationToggle,
  className,
  ariaLabel = 'Current cabinet page',
  renderLink,
}: CabinetTopBarProps) {
  return (
    <div className={clsx(css.topbar, className)}>
      <BreadcrumbTrail
        items={items}
        ariaLabel={ariaLabel}
        leadingIcon={leadingIcon}
        separatorIcon={<ChevronRight size={17} />}
        renderLink={renderLink}
        classNames={{
          nav: css.pathNav,
          list: css.pathList,
          item: css.pathItem,
          link: css.link,
          current: css.current,
          text: css.text,
          separator: css.separator,
          leadingIcon: css.leadingIcon,
        }}
      />

      {actions ? <div className={css.actions}>{actions}</div> : null}
      {navigationToggle ? (
        <div className={css.navigationToggle}>{navigationToggle}</div>
      ) : null}
    </div>
  );
}

export default CabinetTopBar;
export { CabinetTopBar };
