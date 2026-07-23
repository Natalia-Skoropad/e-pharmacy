import type { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import { ImagePreview } from '../../media/ImagePreview';
import { formatInitials } from '../helpers/format-initials';

import css from './UserBadge.module.css';

//===================================================================

export type UserBadgeVariant = 'light' | 'dark';

//===================================================================

type UserBadgeLinkRenderProps = {
  href: string;
  className: string;
  children: ReactNode;
  onClick?: () => void;
};

export type UserBadgeProps = {
  name?: string | null;
  email?: string | null;
  pictureUrl?: string | null;
  pictureAlt?: string;
  fallbackLabel?: string;
  href?: string;
  variant?: UserBadgeVariant;
  className?: string;
  meta?: ReactNode;
  onClick?: () => void;
  renderLink?: (props: UserBadgeLinkRenderProps) => ReactNode;
};

//===================================================================

function UserBadge({
  name,
  email,
  pictureUrl,
  pictureAlt = '',
  fallbackLabel = 'Profile',
  href,
  variant = 'light',
  className,
  meta,
  onClick,
  renderLink,
}: UserBadgeProps) {
  const label = name ?? email ?? fallbackLabel;
  const secondaryText = meta ?? (name && email ? email : null);

  const content = (
    <>
      <span className={css.picture} aria-hidden={!pictureAlt}>
        {pictureUrl ? (
          <ImagePreview src={pictureUrl} alt={pictureAlt} />
        ) : (
          formatInitials(label)
        )}
      </span>

      <span className={css.textWrap}>
        <span className={css.name}>{label}</span>
        {secondaryText ? (
          <span className={css.meta}>{secondaryText}</span>
        ) : null}
      </span>
    </>
  );

  const classNames = clsx(css.badge, css[variant], className);

  if (href) {
    if (renderLink) {
      return renderLink({
        href,
        className: classNames,
        children: content,
        onClick,
      });
    }

    return (
      <Link className={classNames} href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <span className={classNames}>{content}</span>;
}

export default UserBadge;

export { UserBadge };
