import { PagePlaceholder } from '@/components/common';

import {
  MEDICINE_STORE_DESCRIPTION,
  MEDICINE_STORE_TITLE,
} from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: MEDICINE_STORE_TITLE,
  description: MEDICINE_STORE_DESCRIPTION,
  path: '/medicine-store',
});

function MedicineStorePage() {
  return (
    <PagePlaceholder
      title={MEDICINE_STORE_TITLE}
      text={MEDICINE_STORE_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(MEDICINE_STORE_TITLE)}
    />
  );
}

export default MedicineStorePage;
