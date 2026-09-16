'use client';

import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { createPortal } from 'react-dom';
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
  escapeOverflow?: boolean;
}>;

type FloatingTooltipPosition = Readonly<{
  top: number;
  left: number;
  width: number;
  arrowLeft: number;
}>;

//===================================================================

function InfoTooltip({
  label,
  title,
  children,
  items,
  className,
  icon,
  escapeOverflow = false,
}: InfoTooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [floatingPosition, setFloatingPosition] =
    useState<FloatingTooltipPosition | null>(null);

  const updateFloatingPosition = useCallback(() => {
    if (!escapeOverflow || typeof window === 'undefined') return;

    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 16;
    const width = Math.min(300, Math.max(220, window.innerWidth - 32));
    const maxLeft = Math.max(viewportPadding, window.innerWidth - width - 16);
    const left = Math.min(Math.max(viewportPadding, rect.left), maxLeft);
    const arrowLeft = Math.min(
      Math.max(12, rect.left + rect.width / 2 - left),
      width - 12
    );

    setFloatingPosition({
      top: rect.bottom + 12,
      left,
      width,
      arrowLeft,
    });
  }, [escapeOverflow]);

  const showFloatingTooltip = useCallback(() => {
    if (!escapeOverflow) return;
    updateFloatingPosition();
    setIsFloatingOpen(true);
  }, [escapeOverflow, updateFloatingPosition]);

  const hideFloatingTooltip = useCallback(() => {
    if (!escapeOverflow) return;
    setIsFloatingOpen(false);
  }, [escapeOverflow]);

  const tooltipContent = (
    <span
      className={clsx(css.tooltip, escapeOverflow && css.floatingTooltip)}
      id={tooltipId}
      role="tooltip"
      style={
        escapeOverflow && floatingPosition
          ? ({
              top: floatingPosition.top,
              left: floatingPosition.left,
              width: floatingPosition.width,
              '--info-tooltip-arrow-left': `${floatingPosition.arrowLeft}px`,
            } as CSSProperties)
          : undefined
      }
    >
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
  );

  return (
    <span
      className={clsx(css.root, className)}
      onMouseEnter={showFloatingTooltip}
      onMouseLeave={hideFloatingTooltip}
      onFocusCapture={showFloatingTooltip}
      onBlurCapture={hideFloatingTooltip}
    >
      <button
        ref={triggerRef}
        className={css.trigger}
        type="button"
        aria-label={label}
        aria-describedby={tooltipId}
      >
        <MessageCircleQuestion size={20} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {escapeOverflow
        ? isFloatingOpen && floatingPosition && typeof document !== 'undefined'
          ? createPortal(tooltipContent, document.body)
          : null
        : tooltipContent}
    </span>
  );
}

export default InfoTooltip;
export { InfoTooltip };
