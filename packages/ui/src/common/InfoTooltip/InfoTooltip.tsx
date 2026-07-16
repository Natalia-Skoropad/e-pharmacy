'use client';

import type { ReactNode } from 'react';
import { CircleHelp, UsersRound } from 'lucide-react';
import clsx from 'clsx';

import css from './InfoTooltip.module.css';

//===================================================================

type InfoTooltipProps = Readonly<{
  label: string;
  title: string;
  children: ReactNode;
  className?: string;
}>;

//===================================================================

function InfoTooltip({ label, title, children, className }: InfoTooltipProps) {
  return (
    <span className={clsx(css.root, className)}>
      <button className={css.trigger} type="button" aria-label={label}>
        <CircleHelp size={18} aria-hidden="true" />
      </button>

      <span className={css.tooltip} role="tooltip">
        <span className={css.icon}>
          <UsersRound size={18} aria-hidden="true" />
        </span>
        
        <span>
          <strong>{title}</strong>
          <span className={css.text}>{children}</span>
        </span>
      </span>
    </span>
  );
}

export default InfoTooltip;
export { InfoTooltip };
