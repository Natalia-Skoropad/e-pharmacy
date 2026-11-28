import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';

import { createBreadcrumbs } from '@/lib/routes';
import { PROFILE_TITLE } from '@/lib/seo/metadata-copy';
import { ProfilePageSkeleton } from '@e-pharmacy/ui/profile';

import css from './ProfilePageContent.module.css';

//===================================================================

export function ClientProfileLoading() {
  return (
    <div className={css.page}>
      <section className={css.section}>
        <Container>
          <Breadcrumbs items={createBreadcrumbs(PROFILE_TITLE)} />
          <ProfilePageSkeleton label="Loading client profile" />
        </Container>
      </section>
    </div>
  );
}
