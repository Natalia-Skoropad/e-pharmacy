'use client';

import { useId, type ReactNode } from 'react';
import { MessageCircleQuestion, UsersRound } from 'lucide-react';
import clsx from 'clsx';

import css from './InfoTooltip.module.css';

//===================================================================

type InfoTooltipProps = Readonly<{
  label: string;
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}>;

//===================================================================

function InfoTooltip({
  label,
  title,
  children,
  className,
  icon,
}: InfoTooltipProps) {
  const tooltipId = useId();

  return (
    <span className={clsx(css.root, className)}>
      <button
        className={css.trigger}
        type="button"
        aria-label={label}
        aria-describedby={tooltipId}
      >
        <MessageCircleQuestion size={20} strokeWidth={2.2} aria-hidden="true" />
      </button>

      <span className={css.tooltip} id={tooltipId} role="tooltip">
        <span className={css.topicIcon} aria-hidden="true">
          {icon ?? <UsersRound size={20} strokeWidth={2} />}
        </span>

        <span className={css.content}>
          <strong className={css.title}>{title}</strong>
          <span className={css.text}>{children}</span>
        </span>
      </span>
    </span>
  );
}

export default InfoTooltip;
export { InfoTooltip };
