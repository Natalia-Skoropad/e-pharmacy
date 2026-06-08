import Link from 'next/link';

import PictureUpload from '../PictureUpload/PictureUpload';
import { formatInitials } from '@e-pharmacy/utils/formatters';
import { cn } from '@e-pharmacy/utils/classes';

import css from './UserBadge.module.css';

//===================================================================

type UserBadgeVariant = 'light' | 'dark';

type UserBadgeProps = {
  name?: string | null;
  pictureUrl?: string | null;
  href?: string;
  variant?: UserBadgeVariant;
  className?: string;
  onClick?: () => void;
};

//===================================================================

function UserBadge({
  name,
  pictureUrl,
  href,
  variant = 'light',
  className,
  onClick,
}: UserBadgeProps) {
  const content = (
    <>
      <span className={css.picture} aria-hidden="true">
        {pictureUrl ? <PictureUpload src={pictureUrl} /> : formatInitials(name)}
      </span>
      <span className={css.name}>{name ?? 'Profile'}</span>
    </>
  );

  const classNames = cn(css.badge, css[variant], className);

  if (href) {
    return (
      <Link className={classNames} href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <span className={classNames}>{content}</span>;
}

export default UserBadge;
