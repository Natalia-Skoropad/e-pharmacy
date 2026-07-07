import Link from 'next/link';
import { FilePlus2 } from 'lucide-react';

import { ButtonLink } from '@e-pharmacy/ui/common';
import { StatusBanner } from '@e-pharmacy/ui/statistics';

import { getPharmacyProfilePath } from '@/lib/layout/routes';

import css from './NewProductRequestPageContent.module.css';

//===================================================================

function NewProductRequestPageContent() {
  return (
    <main className={css.page} aria-labelledby="new-request-page-title">
      <div className={css.contentCard}>
        <div className={css.stack}>
          <h1 className={css.title} id="new-request-page-title">
            <FilePlus2 className={css.titleIcon} size={30} aria-hidden="true" />
            <span>New product request</span>
          </h1>

          <StatusBanner
            status="new"
            label="New"
            title="Product request creation is locked for now"
            message="Creating product requests is locked while the pharmacy has the new status. This action opens after Admin verifies your pharmacy profile."
          />

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
        </div>
      </div>
    </main>
  );
}

export default NewProductRequestPageContent;
export { NewProductRequestPageContent };
