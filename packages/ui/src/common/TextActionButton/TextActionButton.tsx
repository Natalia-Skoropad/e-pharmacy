import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import Link, { type LinkProps } from 'next/link';
import clsx from 'clsx';

import css from './TextActionButton.module.css';

//===========================================================================

type TextActionButtonBaseProps = {
  className?: string;
};

type TextActionButtonAsButton = TextActionButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    href?: never;
  };

type TextActionButtonAsLink = TextActionButtonBaseProps &
  LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | 'className' | 'href'> & {
    href: LinkProps['href'];
  };

type TextActionButtonProps = TextActionButtonAsButton | TextActionButtonAsLink;

//===========================================================================

function isTextActionButtonLink(
  props: TextActionButtonProps,
): props is TextActionButtonAsLink {
  return props.href !== undefined;
}

//===========================================================================

function TextActionButton(props: TextActionButtonProps) {
  if (isTextActionButtonLink(props)) {
    const { className, href, ...linkProps } = props;

    return (
      <Link
        href={href}
        className={clsx(css.button, className)}
        {...linkProps}
      />
    );
  }

  const { className, type = 'button', ...buttonProps } = props;

  return (
    <button
      type={type}
      className={clsx(css.button, className)}
      {...buttonProps}
    />
  );
}

export default TextActionButton;
