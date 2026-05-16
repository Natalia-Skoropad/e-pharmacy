import { Menu, X } from 'lucide-react';

import css from './BurgerButton.module.css';

//===================================================================

type BurgerButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};

//===================================================================

function BurgerButton({ isOpen, onClick }: BurgerButtonProps) {
  const Icon = isOpen ? X : Menu;

  return (
    <button
      className={css.button}
      type="button"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
      onClick={onClick}
    >
      <Icon size={24} aria-hidden="true" strokeWidth={2} />
    </button>
  );
}

export default BurgerButton;
