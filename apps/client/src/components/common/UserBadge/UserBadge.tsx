import Link from 'next/link';

import AvatarImage from '@/components/common/AvatarImage';
import { cn } from '@/lib/utils';

import css from './UserBadge.module.css';

//===================================================================

type UserBadgeVariant = 'light' | 'dark';

type UserBadgeProps = {
  name?: string | null;
  avatarUrl?: string | null;
  href?: string;
  variant?: UserBadgeVariant;
  className?: string;
  onClick?: () => void;
};

//===================================================================

function getUserInitials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'U';

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

//===================================================================

function UserBadge({
  name,
  avatarUrl,
  href,
  variant = 'light',
  className,
  onClick,
}: UserBadgeProps) {
  const content = (
    <>
      <span className={css.avatar} aria-hidden="true">
        {avatarUrl ? <AvatarImage src={avatarUrl} /> : getUserInitials(name)}
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
