'use client';

import { Button, ButtonLink } from '../../common';
import StatusPageLayout from '../StatusPageLayout/StatusPageLayout';

//===================================================================

type ErrorPageProps = {
  title: string;
  description: string;
  onRetry: () => void;
  homeHref: string;
  homeLabel?: string;
  retryLabel?: string;
  eyebrow?: string;
  imageSrc?: string;
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
  imageSrc = '/images/home/three-pills.png',
}: ErrorPageProps) {
  return (
    <StatusPageLayout
      eyebrow={eyebrow}
      title={title}
      titleId="error-title"
      description={description}
      image={{
        src: imageSrc,
        alt: '',
        width: 749,
        height: 508,
        priority: true,
      }}
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
