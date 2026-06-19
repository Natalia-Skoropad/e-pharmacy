import ButtonLink from '../../common/ButtonLink/ButtonLink';

import StatusPageLayout, {
  type StatusPageLayoutImage,
  type StatusPageLayoutVariant,
} from '../StatusPageLayout/StatusPageLayout';

//===================================================================

type NotFoundPageAction = {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

type NotFoundPageProps = {
  title: string;
  description: string;
  homeHref: string;
  homeLabel?: string;
  eyebrow?: string;
  secondaryAction?: NotFoundPageAction;
  image?: StatusPageLayoutImage;
  imageSrc?: string;
  variant?: StatusPageLayoutVariant;
};

//===================================================================

function NotFoundPage({
  title,
  description,
  homeHref,
  homeLabel = 'Back to home',
  eyebrow = '404',
  secondaryAction,
  image,
  imageSrc,
  variant,
}: NotFoundPageProps) {
  const pageImage =
    image ??
    (imageSrc
      ? {
          src: imageSrc,
          alt: '',
          width: 749,
          height: 508,
          priority: true,
        }
      : undefined);

  return (
    <StatusPageLayout
      eyebrow={eyebrow}
      title={title}
      titleId="not-found-title"
      description={description}
      image={pageImage}
      variant={variant}
      actions={
        <>
          <ButtonLink href={homeHref} size="lg">
            {homeLabel}
          </ButtonLink>

          {secondaryAction ? (
            <ButtonLink
              href={secondaryAction.href}
              variant={secondaryAction.variant ?? 'secondary'}
              size="lg"
            >
              {secondaryAction.label}
            </ButtonLink>
          ) : null}
        </>
      }
    />
  );
}

export default NotFoundPage;

export { NotFoundPage };
