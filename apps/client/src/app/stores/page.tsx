import { StoresPageContent } from '@/components/stores';

import { STORES_DESCRIPTION, STORES_TITLE } from '@/lib/constants/metadata';
import { createPageMetadata } from '@/lib/seo';
import { getStores } from '@/services';

//===================================================================

export const dynamic = 'force-dynamic';

//===================================================================

export const metadata = createPageMetadata({
  title: STORES_TITLE,
  description: STORES_DESCRIPTION,
  path: '/stores',
});

//===================================================================

async function StoresPage() {
  const storesData = await getStores({ page: 1, perPage: 12 }).catch(
    () => null
  );

  return (
    <StoresPageContent
      stores={storesData?.items ?? []}
      total={storesData?.total ?? 0}
      isUnavailable={!storesData}
    />
  );
}

export default StoresPage;
