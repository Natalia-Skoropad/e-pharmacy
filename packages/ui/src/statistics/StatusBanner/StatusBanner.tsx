import type { ReactNode } from 'react';
import clsx from 'clsx';

import {
  getStatusTone,
  type PharmacyStatusVariant,
} from '../StatusBadge/status-types';

import { StatusBadge } from '../StatusBadge/StatusBadge';

import css from './StatusBanner.module.css';

//===================================================================

type StatusBannerProps = Readonly<{
  status: PharmacyStatusVariant;
  title: string;
  message: string;
  label?: string;
  className?: string;
  meta?: ReactNode;
}>;

//===================================================================

export function StatusBanner({
  status,
  title,
  message,
  label,
  className,
  meta,
}: StatusBannerProps) {
  const tone = getStatusTone(status);

  return (
    <section className={clsx(css.banner, css[tone], className)}>
      <div className={css.header}>
        <h2 className={css.title}>{title}</h2>
        <StatusBadge status={status} label={label} />
      </div>
      <p className={css.message}>{message}</p>
      {meta ? <div className={css.meta}>{meta}</div> : null}
    </section>
  );
}
