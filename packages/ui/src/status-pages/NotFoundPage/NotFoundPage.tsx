import ButtonLink from '../../common/ButtonLink/ButtonLink';
import StatusPageLayout from '../StatusPageLayout/StatusPageLayout';

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
  imageSrc?: string;
};

//===================================================================

function NotFoundPage({
  title,
  description,
  homeHref,
  homeLabel = 'Back to home',
  eyebrow = '404',
  secondaryAction,
  imageSrc = '/images/home/three-pills.png',
}: NotFoundPageProps) {
  return (
    <StatusPageLayout
      eyebrow={eyebrow}
      title={title}
      titleId="not-found-title"
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
