import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

import css from './IconButton.module.css';

//===================================================================

export type IconButtonSize = 'sm' | 'md';

//===================================================================

export type IconButtonProps = Readonly<{
  label: string;
  icon: ReactNode;
  size?: IconButtonSize;
}> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>;

//===================================================================

function IconButton({
  label,
  icon,
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={clsx(css.button, css[size], className)}
      type={type}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
}

export default IconButton;
export { IconButton };
