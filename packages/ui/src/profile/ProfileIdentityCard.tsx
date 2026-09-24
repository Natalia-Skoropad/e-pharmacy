import type { ReactNode } from 'react';

import css from './Profile.module.css';

//===================================================================

export type ProfileIdentityDetail = Readonly<{
  label: string;
  value: ReactNode;
}>;

export type ProfileIdentityCardProps = Readonly<{
  name: string;
  email?: string | null;
  roleLabel?: string | null;
  statusLabel?: string | null;
  pictureEditor?: ReactNode;
  details?: readonly ProfileIdentityDetail[];
  children?: ReactNode;
  ariaLabel?: string;
}>;

//===================================================================

export function ProfileIdentityCard({
  name,
  email,
  roleLabel,
  statusLabel,
  pictureEditor,
  details = [],
  children,
  ariaLabel = 'Profile summary',
}: ProfileIdentityCardProps) {
  const identityDetails: ProfileIdentityDetail[] = [
    ...(roleLabel ? [{ label: 'Role', value: roleLabel }] : []),
    ...(statusLabel ? [{ label: 'Status', value: statusLabel }] : []),
    ...details,
  ];

  return (
    <section className={css.identityCard} aria-label={ariaLabel}>
      {pictureEditor}

      <div className={css.nameBlock}>
        <p className={css.name}>{name}</p>
        {email ? <p className={css.email}>{email}</p> : null}
      </div>

      {identityDetails.length > 0 ? (
        <dl className={css.details}>
          {identityDetails.map((detail, index) => (
            <div
              className={css.detailRow}
              key={`${detail.label}-${index.toString()}`}
            >
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {children ? <div className={css.identityExtra}>{children}</div> : null}
    </section>
  );
}
