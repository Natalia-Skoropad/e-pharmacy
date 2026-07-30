'use client';

import { Button } from '../../primitives';
import { LinkButton } from '../../navigation';

import StatusPageLayout, {
  type StatusPageLayoutImage,
  type StatusPageLayoutVariant,
} from '../StatusPageLayout/StatusPageLayout';

//===================================================================

export type ErrorPageProps = Readonly<{
  title: string;
  description: string;
  onRetry: () => void;
  homeHref: string;
  homeLabel?: string;
  retryLabel?: string;
  eyebrow?: string;
  image?: StatusPageLayoutImage;
  variant?: StatusPageLayoutVariant;
}>;

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
  variant,
}: ErrorPageProps) {
  return (
    <StatusPageLayout
      eyebrow={eyebrow}
      title={title}
      description={description}
      image={image}
      variant={variant}
      actions={
        <>
          <Button type="button" size="lg" onClick={onRetry}>
            {retryLabel}
          </Button>

          <LinkButton href={homeHref} variant="secondary" size="lg">
            {homeLabel}
          </LinkButton>
        </>
      }
    />
  );
}

export default ErrorPage;
export { ErrorPage };
