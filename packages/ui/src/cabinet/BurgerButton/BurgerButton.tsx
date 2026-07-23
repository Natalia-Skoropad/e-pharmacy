import { Menu, X } from 'lucide-react';
import clsx from 'clsx';

import css from './BurgerButton.module.css';

//===================================================================

type BurgerButtonVariant = 'default' | 'light';

//===================================================================

type BurgerButtonProps = {
  isOpen: boolean;
  controlsId: string;
  onClick: () => void;
  openLabel?: string;
  closeLabel?: string;
  variant?: BurgerButtonVariant;
  className?: string;
};

//===================================================================

function BurgerButton({
  controlsId,
  isOpen,
  onClick,
  openLabel = 'Open menu',
  closeLabel = 'Close menu',
  variant = 'default',
  className,
}: BurgerButtonProps) {
  const Icon = isOpen ? X : Menu;

  return (
    <button
      className={clsx(css.button, css[variant], className)}
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
