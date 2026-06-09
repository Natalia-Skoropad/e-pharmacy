import { Menu, X } from 'lucide-react';

import css from './BurgerButton.module.css';

//===================================================================

type BurgerButtonProps = {
  isOpen: boolean;
  controlsId: string;
  onClick: () => void;
  openLabel?: string;
  closeLabel?: string;
};

//===================================================================

function BurgerButton({
  controlsId,
  isOpen,
  onClick,
  openLabel = 'Open menu',
  closeLabel = 'Close menu',
}: BurgerButtonProps) {
  const Icon = isOpen ? X : Menu;

  return (
    <button
      className={css.button}
      type="button"
      aria-label={isOpen ? closeLabel : openLabel}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      onClick={onClick}
    >
      <Icon size={24} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

export default BurgerButton;

export { BurgerButton };
