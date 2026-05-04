import { PagePlaceholder } from '@/components/common';

import { STORES_DESCRIPTION, STORES_TITLE } from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: STORES_TITLE,
  description: STORES_DESCRIPTION,
  path: '/stores',
});

function StoresPage() {
  return (
    <PagePlaceholder
      title={STORES_TITLE}
      text={STORES_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(STORES_TITLE)}
    />
  );
}

export default StoresPage;
