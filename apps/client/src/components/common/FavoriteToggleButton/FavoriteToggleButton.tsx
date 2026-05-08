'use client';

import { Heart } from 'lucide-react';

import css from './FavoriteToggleButton.module.css';

//===================================================================

type FavoriteToggleButtonProps = {
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
};

//===================================================================

function FavoriteToggleButton({
  isActive,
  disabled = false,
  onClick,
  activeLabel = 'Remove from favorites',
  inactiveLabel = 'Add to favorites',
}: FavoriteToggleButtonProps) {
  return (
    <button
      className={isActive ? css.favoriteActive : css.favorite}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={isActive ? activeLabel : inactiveLabel}
    >
      <Heart size={22} aria-hidden="true" />
    </button>
  );
}

export default FavoriteToggleButton;
