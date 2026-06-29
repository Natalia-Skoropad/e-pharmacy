import Link from 'next/link';

import { ButtonLink, StatusBanner } from '@e-pharmacy/ui/common';

import {
  getPharmacyAllProductsPath,
  getPharmacyProfilePath,
} from '@/lib/pharmacy/routes';

import css from './LockedPharmacyFeaturePage.module.css';

//===================================================================

type LockedPharmacyFeaturePageProps = Readonly<{
  title: string;
  description: string;
  featureName: string;
}>;

//===================================================================

function LockedPharmacyFeaturePage({
  title,
  description,
  featureName,
}: LockedPharmacyFeaturePageProps) {
  return (
    <main className={css.page} aria-labelledby="locked-feature-page-title">
      <div className={css.pageHeader}>
        <h1 className={css.title} id="locked-feature-page-title">
          {title}
        </h1>
        <p className={css.description}>{description}</p>
      </div>

      <div className={css.contentCard}>
        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title={`${featureName} is locked for now`}
            message="This page belongs to business functionality that opens after Admin verifies your pharmacy profile."
          />

          <section className={css.card} aria-labelledby="locked-feature-title">
            <h2 id="locked-feature-title">What can you do now?</h2>
            <p>
              Complete the pharmacy profile, check that registration documents are attached,
              and send the profile for verification. While the pharmacy is new, you can also
              browse active Admin products in the global catalog.
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
              <ButtonLink
                href={getPharmacyAllProductsPath()}
                variant="secondary"
                renderLink={({ href, className, children, ...props }) => (
                  <Link href={href} className={className} {...props}>
                    {children}
                  </Link>
                )}
              >
                View all products
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default LockedPharmacyFeaturePage;
export { LockedPharmacyFeaturePage };
