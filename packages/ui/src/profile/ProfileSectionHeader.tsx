import type { ReactNode } from 'react';

import css from './Profile.module.css';

//===================================================================

export type ProfileSectionHeaderProps = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  icon: ReactNode;
  titleId?: string;
  action?: ReactNode;
}>;

//===================================================================

export function ProfileSectionHeader({
  title,
  description,
  icon,
  titleId,
  action,
}: ProfileSectionHeaderProps) {
  return (
    <div className={css.sectionHeader}>
      <div className={css.sectionHeaderMain}>
        <span className={css.sectionHeaderIcon} aria-hidden="true">
          {icon}
        </span>

        <div className={css.sectionHeaderCopy}>
          <h2 className={css.sectionHeaderTitle} id={titleId}>
            {title}
          </h2>
          {description ? (
            <p className={css.sectionHeaderText}>{description}</p>
          ) : null}
        </div>
      </div>

      {action ? <div className={css.sectionHeaderAction}>{action}</div> : null}
    </div>
  );
}
