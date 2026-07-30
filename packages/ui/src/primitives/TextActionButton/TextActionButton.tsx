import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import Link, { type LinkProps } from 'next/link';
import clsx from 'clsx';

import css from './TextActionButton.module.css';

//===========================================================================

export type TextActionButtonVariant = 'accent' | 'light';

//===========================================================================

type TextActionButtonBaseProps = {
  className?: string;
  variant?: TextActionButtonVariant;
};

type TextActionButtonAsButton = TextActionButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    href?: never;
  };

//===========================================================================

type TextActionButtonAsLink = TextActionButtonBaseProps &
  LinkProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof LinkProps | 'className' | 'href'
  > & {
    href: LinkProps['href'];
  };

//===========================================================================

type TextActionButtonProps = TextActionButtonAsButton | TextActionButtonAsLink;

//===========================================================================

function isTextActionButtonLink(
  props: TextActionButtonProps
): props is TextActionButtonAsLink {
  return props.href !== undefined;
}

//===========================================================================

function getTextActionButtonClassName(
  variant: TextActionButtonVariant,
  className?: string
) {
  return clsx(css.button, css[variant], className);
}

//===========================================================================

function TextActionButton(props: TextActionButtonProps) {
  if (isTextActionButtonLink(props)) {
    const { className, href, variant = 'accent', ...linkProps } = props;

    return (
      <Link
        href={href}
        className={getTextActionButtonClassName(variant, className)}
        {...linkProps}
      />
    );
  }

  const {
    className,
    type = 'button',
    variant = 'accent',
    ...buttonProps
  } = props;

  return (
    <button
      type={type}
      className={getTextActionButtonClassName(variant, className)}
      {...buttonProps}
    />
  );
}

export default TextActionButton;
export { TextActionButton };
