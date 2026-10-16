'use client';

import {
  useCallback,
  useEffect,
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
  icon?: ReactNode;
}>;

type InfoTooltipProps = Readonly<{
  label: string;
  title: string;
  children?: ReactNode;
  items?: readonly InfoTooltipItem[];
  className?: string;
  icon?: ReactNode;
  escapeOverflow?: boolean;
  /** Use the browser top layer for tooltips inside clipped or stacked layouts. */
  preferTopLayer?: boolean;
}>;

type FloatingTooltipPosition = Readonly<{
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  arrowLeft: number;
  openAbove: boolean;
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
  preferTopLayer = false,
}: InfoTooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const floatingTooltipRef = useRef<HTMLSpanElement | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);

  const [floatingPosition, setFloatingPosition] =
    useState<FloatingTooltipPosition | null>(null);

  const updateFloatingPosition = useCallback(() => {
    if (!escapeOverflow || typeof window === 'undefined') return;

    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 16;
    const width = Math.min(320, Math.max(240, window.innerWidth - 32));
    const maxLeft = Math.max(viewportPadding, window.innerWidth - width - 16);
    const left = Math.min(Math.max(viewportPadding, rect.left), maxLeft);

    const arrowLeft = Math.min(
      Math.max(12, rect.left + rect.width / 2 - left),
      width - 12
    );

    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    const openAbove = availableBelow < 230 && availableAbove > availableBelow;

    setFloatingPosition({
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 12 }
        : { top: rect.bottom + 12 }),
      left,
      width,
      arrowLeft,
      openAbove,
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

  useEffect(() => {
    if (!escapeOverflow || !isFloatingOpen) return;

    window.addEventListener('resize', updateFloatingPosition);
    window.addEventListener('scroll', updateFloatingPosition, true);

    return () => {
      window.removeEventListener('resize', updateFloatingPosition);
      window.removeEventListener('scroll', updateFloatingPosition, true);
    };
  }, [escapeOverflow, isFloatingOpen, updateFloatingPosition]);

  // Portals escape clipping, but not every competing stacking context.
  // The native popover top layer reliably clears both for opted-in tooltips.
  useEffect(() => {
    if (!escapeOverflow || !preferTopLayer || !isFloatingOpen) return;

    const tooltip = floatingTooltipRef.current;

    if (
      !tooltip ||
      typeof tooltip.showPopover !== 'function' ||
      tooltip.matches(':popover-open')
    ) {
      return;
    }

    tooltip.showPopover();
  }, [escapeOverflow, preferTopLayer, isFloatingOpen]);

  const tooltipContent = (
    <span
      ref={floatingTooltipRef}
      popover={escapeOverflow && preferTopLayer ? 'manual' : undefined}
      className={clsx(
        css.tooltip,
        escapeOverflow && preferTopLayer && css.floatingTooltipTopLayer,
        escapeOverflow && css.floatingTooltip,
        escapeOverflow &&
          floatingPosition?.openAbove &&
          css.floatingTooltipAbove
      )}
      id={tooltipId}
      role="tooltip"
      style={
        escapeOverflow && floatingPosition
          ? ({
              top: floatingPosition.top,
              bottom: floatingPosition.bottom,
              left: floatingPosition.left,
              width: floatingPosition.width,
              '--info-tooltip-arrow-left': `${floatingPosition.arrowLeft}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <span className={css.heading}>
        <span className={css.topicIcon} aria-hidden="true">
          {icon ?? <UsersRound size={20} strokeWidth={2} />}
        </span>

        <strong className={css.title}>{title}</strong>
      </span>

      <span className={css.content}>
        {items?.length ? (
          <span className={css.items}>
            {items.map((item) => (
              <span
                className={clsx(css.item, !item.icon && css.itemWithoutIcon)}
                key={item.title}
              >
                {item.icon ? (
                  <span className={css.itemIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}

                <span className={css.itemCopy}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </span>
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
        aria-describedby={
          !escapeOverflow || isFloatingOpen ? tooltipId : undefined
        }
        onPointerEnter={showFloatingTooltip}
        onMouseEnter={showFloatingTooltip}
        onFocus={showFloatingTooltip}
        onClick={showFloatingTooltip}
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
