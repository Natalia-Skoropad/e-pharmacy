import type { ReactNode } from 'react';
import clsx from 'clsx';

import { StatusBadge, type StatusTone } from '../StatusBadge/StatusBadge';

import css from './StatusBanner.module.css';

//===================================================================

export type StatusBannerProps = Readonly<{
  tone: StatusTone;
  title: string;
  message: string;
  label?: string;
  className?: string;
  meta?: ReactNode;
}>;

//===================================================================

export function StatusBanner({
  tone,
  title,
  message,
  label,
  className,
  meta,
}: StatusBannerProps) {
  return (
    <section className={clsx(css.banner, css[tone], className)}>
      <div className={css.header}>
        <h2 className={css.title}>{title}</h2>
        {label ? <StatusBadge tone={tone} label={label} /> : null}
      </div>

      <p className={css.message}>{message}</p>
      {meta ? <div className={css.meta}>{meta}</div> : null}
    </section>
  );
}
