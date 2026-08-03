'use client';

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
    { value: 'details', label: 'Details' },
    ...(canShowBankDetails
      ? [{ value: 'payment' as const, label: 'Bank details' }]
      : []),
    { value: 'about', label: 'About pharmacy' },
    { value: 'reviews', label: `Reviews (${reviewsTotal})` },
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
