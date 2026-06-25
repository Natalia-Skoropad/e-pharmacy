import type { Metadata } from 'next';

import { getProfileBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';

//===================================================================

export const metadata: Metadata = {
  title: 'Pharmacy profile',
  description: 'Manage pharmacy profile data and moderation status.',
};

//===================================================================

function PharmacyProfilePage() {
  return (
    <PharmacyPage
      title="Pharmacy profile"
      description="Profile summary and tab skeleton for pharmacy data, about pharmacy, payment details, and reviews."
      breadcrumbs={getProfileBreadcrumbs()}
    >
      <PlaceholderCards
        items={[
          'Left profile summary',
          'Pharmacy data tab',
          'About pharmacy tab',
          'Payment details tab',
          'Reviews tab',
          'Moderation actions',
        ]}
      />
    </PharmacyPage>
  );
}

export default PharmacyProfilePage;
