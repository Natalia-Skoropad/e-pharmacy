'use client';

import Link from 'next/link';
import { FilePlus2 } from 'lucide-react';

import { ButtonLink } from '@e-pharmacy/ui/common';
import { StatusBanner } from '@e-pharmacy/ui/statistics';
import { PageHeader } from '@e-pharmacy/ui/layout';

import { getPharmacyProfilePath } from '@/lib/layout/routes';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import css from './ProductRequestDetailsPageContent.module.css';

//===================================================================

type ProductRequestDetailsPageContentProps = Readonly<{
  requestId: string;
}>;

//===================================================================

function ProductRequestDetailsPageContent({
  requestId,
}: ProductRequestDetailsPageContentProps) {
  const title = `Product request #${requestId}`;
  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const bannerLabel = bannerStatus
    ? getLockedFeatureBannerLabel(bannerStatus)
    : null;

  return (
    <main className={css.page} aria-labelledby="product-requests-page">
      <div className={css.contentCard}>
        <div className={css.stack}>
          <PageHeader
            title={title}
            titleId="product-request-details-page-title"
            icon={<FilePlus2 size={23} aria-hidden="true" />}
          />

          {bannerStatus ? (
            <StatusBanner
              status={bannerStatus}
              label={bannerLabel ?? undefined}
            title="Product request details is locked for now"
            message="This page belongs to business functionality that opens after Admin verifies your pharmacy profile."
            />
          ) : null}

          {bannerStatus ? (
          <section className={css.card} aria-labelledby="request-actions-title">
            <h2 id="request-actions-title">What can you do now?</h2>
            <p>
              Complete the pharmacy profile, check that registration documents
              are attached, and send the profile for verification.
            </p>
            <div className={css.actions}>
              <ButtonLink
                href={getPharmacyProfilePath()}
                renderLink={({ href, className, children, ...props }) => (
                  <Link href={href} className={className} {...props}>
                    {children}
                  </Link>
                )}
              >
                Go to profile
              </ButtonLink>
            </div>
          </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default ProductRequestDetailsPageContent;
export { ProductRequestDetailsPageContent };
