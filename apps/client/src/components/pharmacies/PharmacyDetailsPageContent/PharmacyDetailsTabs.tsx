'use client';

import { Building2, Landmark, FileText, Star } from 'lucide-react';

import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';

//===================================================================

export type PharmacyTab = 'details' | 'payment' | 'about' | 'reviews';

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
  reviewsTotal,
  canShowBankDetails,
  onChange,
}: PharmacyDetailsTabsProps) {
  const items: TabItem<PharmacyTab>[] = [
    {
      value: 'details',
      label: 'Details',
      icon: <Building2 size={17} aria-hidden="true" />,
    },

    ...(canShowBankDetails
      ? [
          {
            value: 'payment' as const,
            label: 'Bank details',
            icon: <Landmark size={17} aria-hidden="true" />,
          },
        ]
      : []),
    {
      value: 'about',
      label: 'About pharmacy',
      icon: <FileText size={17} aria-hidden="true" />,
    },
    {
      value: 'reviews',
      label: `Reviews (${reviewsTotal})`,
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
