'use client';

import { useId, type ReactNode } from 'react';
import { MessageCircleQuestion, UsersRound } from 'lucide-react';
import clsx from 'clsx';

import css from './InfoTooltip.module.css';

//===================================================================

export type InfoTooltipItem = Readonly<{
  title: string;
  description: ReactNode;
}>;

type InfoTooltipProps = Readonly<{
  label: string;
  title: string;
  children?: ReactNode;
  items?: readonly InfoTooltipItem[];
  className?: string;
  icon?: ReactNode;
}>;

//===================================================================

function InfoTooltip({
  label,
  title,
  children,
  items,
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
          {items?.length ? (
            <span className={css.items}>
              {items.map((item) => (
                <span className={css.item} key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </span>
              ))}
            </span>
          ) : (
            <span className={css.text}>{children}</span>
          )}
        </span>
      </span>
    </span>
  );
}

export default InfoTooltip;
export { InfoTooltip };
