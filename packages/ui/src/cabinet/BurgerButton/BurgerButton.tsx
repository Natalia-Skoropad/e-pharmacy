import { Menu, X } from 'lucide-react';
import clsx from 'clsx';

import IconButton from '../../primitives/IconButton/IconButton';

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
    <IconButton
      className={clsx(css.button, css[variant], className)}
      label={isOpen ? closeLabel : openLabel}
      icon={<Icon size={24} strokeWidth={2} aria-hidden="true" />}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      onClick={onClick}
    />
  );
}

export default BurgerButton;
export { BurgerButton };
