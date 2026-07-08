'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';

import { ButtonLink } from '@e-pharmacy/ui/common';
import { StatusBanner } from '@e-pharmacy/ui/statistics';
import { PageHeader } from '@e-pharmacy/ui/layout';

import { getPharmacyProfilePath } from '@/lib/layout/routes';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type ClientDetailsPageContentProps = Readonly<{
  clientId: string;
}>;

//===================================================================

function ClientDetailsPageContent({ clientId }: ClientDetailsPageContentProps) {
  const title = `Client #${clientId}`;
  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const bannerLabel = getLockedFeatureBannerLabel(bannerStatus);

  return (
    <main className={css.page} aria-labelledby="client-details-page-title">
      <div className={css.contentCard}>
        <div className={css.stack}>
          <PageHeader
            title={title}
            titleId="client-details-page-title"
            icon={<Users size={23} aria-hidden="true" />}
          />

          <StatusBanner
            status={bannerStatus}
            label={bannerLabel}
            title="Client details is locked for now"
            message="This page belongs to business functionality that opens after Admin verifies your pharmacy profile."
          />

          <section className={css.card} aria-labelledby="client-actions-title">
            <h2 id="client-actions-title">What can you do now?</h2>
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
        </div>
      </div>
    </main>
  );
}

export default ClientDetailsPageContent;
export { ClientDetailsPageContent };
