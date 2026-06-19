'use client';

import { Button, ButtonLink } from '../../common';

import StatusPageLayout, {
  type StatusPageLayoutImage,
  type StatusPageLayoutVariant,
} from '../StatusPageLayout/StatusPageLayout';

//===================================================================

type ErrorPageProps = {
  title: string;
  description: string;
  onRetry: () => void;
  homeHref: string;
  homeLabel?: string;
  retryLabel?: string;
  eyebrow?: string;
  image?: StatusPageLayoutImage;
  imageSrc?: string;
  variant?: StatusPageLayoutVariant;
};

//===================================================================

function ErrorPage({
  title,
  description,
  onRetry,
  homeHref,
  homeLabel = 'Back to home',
  retryLabel = 'Try again',
  eyebrow = 'Page error',
  image,
  imageSrc,
  variant,
}: ErrorPageProps) {
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
      titleId="error-title"
      description={description}
      image={pageImage}
      variant={variant}
      actions={
        <>
          <Button type="button" size="lg" onClick={onRetry}>
            {retryLabel}
          </Button>

          <ButtonLink href={homeHref} variant="secondary" size="lg">
            {homeLabel}
          </ButtonLink>
        </>
      }
    />
  );
}

export default ErrorPage;

export { ErrorPage };
