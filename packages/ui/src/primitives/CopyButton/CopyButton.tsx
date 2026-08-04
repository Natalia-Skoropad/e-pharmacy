import type { ButtonHTMLAttributes } from 'react';
import { Copy } from 'lucide-react';
import clsx from 'clsx';

import IconButton from '../IconButton/IconButton';

import css from './CopyButton.module.css';

//===================================================================

export type CopyButtonProps = Readonly<{
  label: string;
}> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>;

//===================================================================

function CopyButton({ label, className, ...props }: CopyButtonProps) {
  return (
    <IconButton
      className={clsx(css.button, className)}
      label={label}
      icon={<Copy size={16} aria-hidden="true" />}
      size="sm"
      {...props}
    />
  );
}

export default CopyButton;
export { CopyButton };
