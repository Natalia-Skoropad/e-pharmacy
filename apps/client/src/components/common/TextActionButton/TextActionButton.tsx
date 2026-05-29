import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import Link, { type LinkProps } from 'next/link';
import clsx from 'clsx';

import css from './TextActionButton.module.css';

//===========================================================================

type TextActionButtonAsButton = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: never;
};

type TextActionButtonAsLink = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    href: LinkProps['href'];
  };

type TextActionButtonProps = TextActionButtonAsButton | TextActionButtonAsLink;

//===========================================================================

function TextActionButton(props: TextActionButtonProps) {
  if ('href' in props && props.href !== undefined) {
    const { className, href, ...linkProps } = props;

    return (
      <Link
        href={href}
        className={clsx(css.button, className)}
        {...linkProps}
      />
    );
  }

  const { className, type, ...buttonProps } = props;

  return (
    <button
      type={type ?? 'button'}
      className={clsx(css.button, className)}
      {...buttonProps}
    />
  );
}

export default TextActionButton;
