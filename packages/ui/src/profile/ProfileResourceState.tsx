import type { ReactNode } from 'react';
import { CircleAlert, LoaderCircle } from 'lucide-react';

import { Button } from '../primitives/Button/Button';
import css from './Profile.module.css';

//===================================================================

export type ProfileResourceStateVariant = 'loading' | 'error' | 'empty';

export type ProfileResourceStateProps = Readonly<{
  variant: ProfileResourceStateVariant;
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  retryLabel?: string;
  onRetry?: () => Promise<unknown> | void;
}>;

//===================================================================

export function ProfileResourceState({
  variant,
  title,
  description,
  icon,
  action,
  retryLabel = 'Retry',
  onRetry,
}: ProfileResourceStateProps) {
  const resolvedIcon =
    icon ??
    (variant === 'loading' ? (
      <LoaderCircle size={28} />
    ) : variant === 'error' ? (
      <CircleAlert size={28} />
    ) : null);

  const resolvedAction =
    action ??
    (variant === 'error' && onRetry ? (
      <Button type="button" onClick={() => void onRetry()}>
        {retryLabel}
      </Button>
    ) : null);

  const role =
    variant === 'error'
      ? 'alert'
      : variant === 'loading'
        ? 'status'
        : undefined;

  const variantClass =
    variant === 'error'
      ? css.resourceStateError
      : variant === 'empty'
        ? css.resourceStateEmpty
        : '';

  return (
    <div
      className={`${css.resourceState} ${variantClass} ${
        resolvedIcon ? '' : css.resourceStateWithoutIcon
      }`}
      role={role}
    >
      {resolvedIcon ? (
        <span
          className={`${css.resourceStateIcon} ${
            variant === 'error'
              ? css.resourceStateErrorIcon
              : css.resourceStateAccentIcon
          } ${variant === 'loading' ? css.resourceStateLoadingIcon : ''}`}
          aria-hidden="true"
        >
          {resolvedIcon}
        </span>
      ) : null}

      <div className={css.resourceStateCopy}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {resolvedAction ? (
        <div className={css.resourceStateAction}>{resolvedAction}</div>
      ) : null}
    </div>
  );
}
