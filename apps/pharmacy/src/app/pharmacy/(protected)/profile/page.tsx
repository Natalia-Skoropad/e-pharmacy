import type { Metadata } from 'next';

import { PharmacyProfilePageContent } from '@/components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Pharmacy profile',
  description: 'Manage pharmacy profile data and moderation status.',
};

//===================================================================

function PharmacyProfilePage() {
  return <PharmacyProfilePageContent />;
}

export default PharmacyProfilePage;
