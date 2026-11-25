import { PackageSearch, ArrowRight, UserRoundCog } from 'lucide-react';

import {
  PRODUCT_REQUEST_STATUS_PRESENTATION,
  USER_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import { formatShortDate } from '@e-pharmacy/utils/date';

import { PharmacyPhotoPlaceholder, ShimmerImage } from '@e-pharmacy/ui/media';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import { buildAdminPharmacyOwnerDetailUrl } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';
import { getProductRequestImageSrc } from '@/lib/product-requests/product-request-images';
import type { AdminRequestDetail } from '@/lib/product-requests/admin-product-request-detail';

import { AdminProductRequestCategory } from './AdminProductRequestCategory';
import { ProductRequestStatusActivity } from './AdminProductRequestStatusActivity';

import ownerCss from '../pharmacies/PharmacyDetailsPageContent/PharmacyInformationTab.module.css';
import css from './AdminProductRequestOverview.module.css';

//===================================================================

export function AdminProductRequestOverview({
  request,
  canViewOwner,
}: {
  request: AdminRequestDetail;
  canViewOwner: boolean;
}) {
  const imageSrc = getProductRequestImageSrc(
    request.image?.dataUrl ?? request.productImageUrl
  );

  const { ownerDetail: owner } = request;

  const notice =
    request.reviewState === 'changes_requested'
      ? 'Admin has requested corrections. Awaiting owner resubmission.'
      : request.status === 'new'
        ? 'This product request has not been submitted for moderation yet.'
        : request.status === 'on_moderation'
          ? 'This product request is awaiting Admin approval.'
          : request.status === 'approved'
            ? 'This product request has been approved.'
            : request.cancelledBy === 'owner'
              ? 'This product request was cancelled by the pharmacy owner.'
              : 'This product request was not approved by Admin.';

  return (
    <div className={css.detailsTab}>
      <div className={css.detailsGrid}>
        <div className={css.visualCard}>
          {imageSrc ? (
            <div className={css.imageFrame}>
              <ShimmerImage
                key={imageSrc}
                src={imageSrc}
                alt={request.name}
                className={css.image}
                sizes="(min-width: 1440px) 420px, 90vw"
                unoptimized
              />
            </div>
          ) : (
            <PharmacyPhotoPlaceholder
              icon={PackageSearch}
              title="No product photo yet"
              description="No photo has been added to this product request."
            />
          )}
        </div>

        <div className={css.card}>
          <p
            className={`${css.productNotice} ${request.status === 'approved' ? css.approved : request.status === 'rejected' ? css.rejected : ''}`}
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
                {request.reviewState ? (
                  <StatusBadge label="Needs changes" tone="neutral" />
                ) : null}
                {request.cancelledBy ? (
                  <StatusBadge
                    label={
                      request.cancelledBy === 'admin'
                        ? 'Cancelled by Admin'
                        : 'Cancelled by owner'
                    }
                    tone="neutral"
                  />
                ) : null}
              </dd>
            </div>

            <div className={css.metadataItem}>
              <dt>Category</dt>
              <dd className={css.statusLine}>
                <AdminProductRequestCategory request={request} />
              </dd>
            </div>

            <div className={css.metadataItem}>
              <dt>Article</dt>
              <dd>{request.values.article || '—'}</dd>
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
              <dd>
                {request.updatedAt
                  ? (formatShortDate(request.updatedAt) ?? '—')
                  : '—'}
              </dd>
            </div>
          </dl>
          <div className={css.ownerActions}>
            <Button
              type="button"
              size="sm"
              fullWidth
              disabled
              iconRight={<ArrowRight size={16} />}
            >
              Open product
            </Button>
            {request.status === 'approved' && request.productId ? (
              <small>
                Catalog product ID: {request.productId}. The Admin product
                details page is not available yet.
              </small>
            ) : null}
          </div>
        </div>
      </div>

      <section
        className={ownerCss.sectionCard}
        aria-labelledby="request-owner-title"
      >
        <div className={ownerCss.sectionHeading}>
          <UserRoundCog size={20} />
          <h3 id="request-owner-title">Pharmacy owner</h3>
        </div>
        {owner ? (
          <div className={ownerCss.ownerRow}>
            <div className={ownerCss.ownerPhoto}>
              {owner.pictureUrl ? (
                <ShimmerImage
                  src={owner.pictureUrl}
                  alt={owner.name}
                  className={ownerCss.coverImage}
                  sizes="64px"
                  unoptimized
                />
              ) : (
                <UserRoundCog size={30} />
              )}
            </div>

            <div className={ownerCss.ownerDetails}>
              {canViewOwner ? (
                <TextActionButton
                  className={css.ownerLink}
                  href={buildAdminPharmacyOwnerDetailUrl(owner.id)}
                >
                  {owner.name}
                </TextActionButton>
              ) : (
                <strong>{owner.name}</strong>
              )}
              <span className={css.ownerIdRow}>
                <span className={ownerCss.muted}>ID: {owner.id}</span>
                <StatusBadge {...USER_STATUS_PRESENTATION[owner.status]} />
              </span>
            </div>
          </div>
        ) : (
          <p className={ownerCss.muted}>
            No linked owner (legacy or incomplete request).
          </p>
        )}
      </section>

      <ProductRequestStatusActivity request={request} />
    </div>
  );
}
