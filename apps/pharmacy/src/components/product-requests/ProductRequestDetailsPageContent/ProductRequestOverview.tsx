import { ArrowRight, PackageSearch } from 'lucide-react';

import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import { isValidObjectId } from '@e-pharmacy/validation/url';
import { formatShortDate } from '@e-pharmacy/utils/date';

import { ShimmerImage } from '@e-pharmacy/ui/media';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { Button } from '@e-pharmacy/ui/primitives';
import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { getProductImageSrc } from '@/lib/products/product-images';
import type { ProductRequestDetailsViewModel } from '@/lib/product-requests/product-requests';
import { getPharmacyAllProductPath } from '@/lib/routes';

import { ProductRequestCategory } from '../ProductRequestCategory';

import css from './ProductRequestOverview.module.css';

//===================================================================

const notices: Readonly<Record<ProductRequestStatus, string>> = {
  new: 'Your product request has not been approved by Admin yet.',
  on_moderation: 'Your product request is awaiting Admin approval.',
  approved: 'Your product request has been approved by Admin.',
  rejected: 'Your product request was not approved by Admin.',
};

//===================================================================

type ProductRequestOverviewProps = Readonly<{
  request: ProductRequestDetailsViewModel;
  categoryDirectory: readonly ProductCategoryReference[];
}>;

//===================================================================

export function ProductRequestOverview({
  request,
  categoryDirectory,
}: ProductRequestOverviewProps) {
  const imageSrc = getProductImageSrc(
    request.productImage?.dataUrl ?? request.productImageUrl
  );

  const productHref =
    request.status === 'approved' && isValidObjectId(request.productId)
      ? getPharmacyAllProductPath(request.productId)
      : null;

  const notice =
    request.reviewState === 'changes_requested'
      ? 'Admin has requested corrections to your product request.'
      : request.status === 'approved' && !productHref
        ? 'Your request has been approved, but the catalog product is not available.'
        : request.status === 'rejected' && request.cancelledBy === 'owner'
          ? 'Your product request was cancelled by the pharmacy.'
          : notices[request.status];

  return (
    <section
      className={css.detailsTab}
      aria-labelledby="request-overview-title"
    >
      <ProfileSectionHeader
        title="Product details"
        titleId="request-overview-title"
        description="Review your saved product request and its moderation status."
        icon={<PackageSearch size={21} aria-hidden="true" />}
      />
      <div className={css.detailsGrid}>
        <div className={css.visualCard}>
          {imageSrc ? (
            <div className={css.imageFrame}>
              <ShimmerImage
                key={imageSrc}
                className={css.image}
                src={imageSrc}
                alt={request.name}
                sizes="(min-width: 1440px) 420px, 90vw"
                unoptimized
              />
            </div>
          ) : (
            <div className={css.imagePlaceholder} aria-hidden="true">
              {request.name.charAt(0)}
            </div>
          )}
        </div>

        <div className={css.card}>
          <p
            className={`${css.productNotice} ${productHref ? css.approved : request.status === 'rejected' ? css.rejected : ''}`}
          >
            {notice}
          </p>
          <dl className={css.metadata}>
            <div className={css.metadataItem}>
              <dt>Status</dt>
              <dd className={css.statusLine}>
                <StatusBadge
                  {...PRODUCT_REQUEST_STATUS_PRESENTATION[request.status]}
                />
                {request.reviewState === 'changes_requested' ? (
                  <StatusBadge label="Needs changes" tone="neutral" />
                ) : null}
                {request.status === 'rejected' && request.cancelledBy ? (
                  <StatusBadge
                    label={`Cancelled by ${request.cancelledBy === 'admin' ? 'Admin' : 'owner'}`}
                    tone="neutral"
                  />
                ) : null}
              </dd>
            </div>

            <div className={css.metadataItem}>
              <dt>Category</dt>
              <dd>
                <ProductRequestCategory
                  request={request}
                  categoryDirectory={categoryDirectory}
                />
              </dd>
            </div>
            <div className={css.metadataItem}>
              <dt>Article</dt>
              <dd>{request.article || '—'}</dd>
            </div>
            <div className={css.metadataItem}>
              <dt>Request ID</dt>
              <dd>{request.id}</dd>
            </div>
            <div className={css.metadataItem}>
              <dt>Creation date</dt>
              <dd>{formatShortDate(request.createdAt) ?? '—'}</dd>
            </div>
            <div className={css.metadataItem}>
              <dt>Last update date</dt>
              <dd>{formatShortDate(request.updatedAt) ?? '—'}</dd>
            </div>
          </dl>
          <div className={css.ownerActions}>
            {productHref ? (
              <LinkButton
                href={productHref}
                size="sm"
                fullWidth
                iconRight={<ArrowRight size={16} aria-hidden="true" />}
              >
                Open product
              </LinkButton>
            ) : (
              <Button
                type="button"
                size="sm"
                fullWidth
                disabled
                iconRight={<ArrowRight size={16} aria-hidden="true" />}
              >
                Open product
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
