import type { ReactNode } from 'react';
import clsx from 'clsx';

import css from './PageHeader.module.css';

//===================================================================

type PageHeaderProps = Readonly<{
  title: ReactNode;
  titleId?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}>;

//===================================================================

function PageHeader({
  title,
  titleId,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={clsx(css.header, className)}>
      <div className={css.titleWrap}>
        {icon ? <span className={css.titleIconWrap}>{icon}</span> : null}

        <h1 className={css.title} id={titleId}>
          {title}
        </h1>
      </div>

      {actions ? <div className={css.actions}>{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
export { PageHeader };
export type { PageHeaderProps };
