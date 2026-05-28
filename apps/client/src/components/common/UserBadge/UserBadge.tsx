import Link from 'next/link';

import AvatarImage from '@/components/common/AvatarImage';
import { formatInitials } from '@/lib/formatters';
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
        {avatarUrl ? <AvatarImage src={avatarUrl} /> : formatInitials(name)}
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
