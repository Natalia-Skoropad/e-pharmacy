import SvgIcon from '@/components/common/SvgIcon';

import css from './BurgerButton.module.css';

//===================================================================

type BurgerButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};

//===================================================================

function BurgerButton({ isOpen, onClick }: BurgerButtonProps) {
  return (
    <button
      className={css.button}
      type="button"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
      onClick={onClick}
    >
      <SvgIcon name={isOpen ? 'icon-close' : 'icon-menu'} size={24} />
    </button>
  );
}

export default BurgerButton;
