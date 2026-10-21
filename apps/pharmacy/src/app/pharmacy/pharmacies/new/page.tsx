import type { Metadata } from 'next';

import { OwnedPharmacyEditor } from '@/components/pharmacies/OwnedPharmacyEditor/OwnedPharmacyEditor';

//===================================================================

export const metadata: Metadata = { title: 'Create pharmacy' };

//===================================================================

export default function CreatePharmacyPage() {
  return <OwnedPharmacyEditor />;
}
