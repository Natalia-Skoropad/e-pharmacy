import type { ButtonVariant } from '../../primitives/Button';
import LinkButton from '../../navigation/LinkButton/LinkButton';

import StatusPageLayout, {
  type StatusPageLayoutImage,
  type StatusPageLayoutVariant,
} from '../StatusPageLayout/StatusPageLayout';

//===================================================================

export type NotFoundPageAction = Readonly<{
  href: string;
  label: string;
  variant?: ButtonVariant;
}>;

export type NotFoundPageProps = Readonly<{
  title: string;
  description: string;
  homeHref: string;
  homeLabel?: string;
  eyebrow?: string;
  secondaryAction?: NotFoundPageAction;
  image?: StatusPageLayoutImage;
  variant?: StatusPageLayoutVariant;
}>;

//===================================================================

function NotFoundPage({
  title,
  description,
  homeHref,
  homeLabel = 'Back to home',
  eyebrow = '404',
  secondaryAction,
  image,
  variant,
}: NotFoundPageProps) {
  return (
    <StatusPageLayout
      eyebrow={eyebrow}
      title={title}
      description={description}
      image={image}
      variant={variant}
      actions={
        <>
          <LinkButton href={homeHref} size="lg">
            {homeLabel}
          </LinkButton>

          {secondaryAction ? (
            <LinkButton
              href={secondaryAction.href}
              variant={secondaryAction.variant ?? 'secondary'}
              size="lg"
            >
              {secondaryAction.label}
            </LinkButton>
          ) : null}
        </>
      }
    />
  );
}

export default NotFoundPage;
export { NotFoundPage };
