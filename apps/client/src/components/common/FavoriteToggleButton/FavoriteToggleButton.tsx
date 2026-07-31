'use client';

import { Heart, LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';

import { runFavoriteToggleLifecycle } from './favorite-toggle-lifecycle';
import css from './FavoriteToggleButton.module.css';

//===================================================================

export type FavoriteToggleButtonProps = Readonly<{
  isActive: boolean;
  isPending?: boolean;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  activeLabel?: string;
  inactiveLabel?: string;
  pendingLabel?: string;
}>;

//===================================================================

function FavoriteToggleButton({
  isActive,
  isPending = false,
  disabled = false,
  onClick,
  activeLabel = 'Remove from favorites',
  inactiveLabel = 'Add to favorites',
  pendingLabel = 'Updating favorites',
}: FavoriteToggleButtonProps) {
  const interactionLockRef = useRef(false);
  const [isLocallyPending, setIsLocallyPending] = useState(false);
  const pending = isPending || isLocallyPending;

  const handleClick = () =>
    runFavoriteToggleLifecycle({
      lock: interactionLockRef,
      disabled,
      pending,
      setLocalPending: setIsLocallyPending,
      onToggle: onClick,
    });

  return (
    <button
      className={isActive ? css.favoriteActive : css.favorite}
      type="button"
      disabled={disabled || pending}
      onClick={() => void handleClick()}
      aria-pressed={isActive}
      aria-busy={pending || undefined}
      aria-label={pending ? pendingLabel : isActive ? activeLabel : inactiveLabel}
    >
      {pending ? (
        <LoaderCircle className={css.spinner} size={22} aria-hidden="true" />
      ) : (
        <Heart size={22} aria-hidden="true" />
      )}
    </button>
  );
}

export default FavoriteToggleButton;
