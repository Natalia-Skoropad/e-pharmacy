'use client';

import { Building2, Landmark, FileText, Star } from 'lucide-react';

import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { ROUTES } from '@/lib/routes';

//===================================================================

export type PharmacyTab = 'details' | 'payment' | 'about' | 'reviews';

//===================================================================

export const PHARMACY_TAB_LABELS: Readonly<Record<PharmacyTab, string>> = {
  details: 'Details',
  payment: 'Bank details',
  about: 'About pharmacy',
  reviews: 'Reviews',
};

//===================================================================

export function getPharmacyDetailsBreadcrumbs(
  pharmacyName: string,
  pharmacyHref: string,
  activeTab: PharmacyTab
) {
  return [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'Pharmacies', href: ROUTES.PHARMACIES },
    {
      label: pharmacyName,

      ...(activeTab !== 'details' ? { href: pharmacyHref } : {}),
    },

    ...(activeTab !== 'details'
      ? [{ label: PHARMACY_TAB_LABELS[activeTab] }]
      : []),
  ];
}

//===================================================================

export type PharmacyDetailsTabsProps = Readonly<{
  idBase: string;
  activeValue: PharmacyTab;
  reviewsTotal: number;
  canShowBankDetails: boolean;
  onChange: (value: PharmacyTab) => void;
}>;

//===================================================================

export function PharmacyDetailsTabs({
  idBase,
  activeValue,
  canShowBankDetails,
  onChange,
}: PharmacyDetailsTabsProps) {
  const items: TabItem<PharmacyTab>[] = [
    {
      value: 'details',
      label: PHARMACY_TAB_LABELS.details,
      icon: <Building2 size={17} aria-hidden="true" />,
    },

    ...(canShowBankDetails
      ? [
          {
            value: 'payment' as const,
            label: PHARMACY_TAB_LABELS.payment,
            icon: <Landmark size={17} aria-hidden="true" />,
          },
        ]
      : []),
    {
      value: 'about',
      label: PHARMACY_TAB_LABELS.about,
      icon: <FileText size={17} aria-hidden="true" />,
    },
    {
      value: 'reviews',
      label: PHARMACY_TAB_LABELS.reviews,
      icon: <Star size={17} aria-hidden="true" />,
    },
  ];

  return (
    <Tabs
      items={items}
      activeValue={activeValue}
      ariaLabel="Pharmacy information tabs"
      idBase={idBase}
      onChange={onChange}
    />
  );
}
