'use client';

import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';

//===================================================================

export type ProductTab = 'about' | 'prices' | 'characteristics' | 'reviews';

//===================================================================

export type ProductDetailsTabsProps = Readonly<{
  idBase: string;
  activeValue: ProductTab;
  offersCount: number;
  reviewsTotal: number;
  onChange: (value: ProductTab) => void;
}>;

//===================================================================

export function ProductDetailsTabs({
  idBase,
  activeValue,
  offersCount,
  reviewsTotal,
  onChange,
}: ProductDetailsTabsProps) {
  const items: TabItem<ProductTab>[] = [
    { value: 'about', label: 'About product' },
    { value: 'prices', label: `Prices in pharmacies (${offersCount})` },
    { value: 'characteristics', label: 'Characteristics' },
    { value: 'reviews', label: `Reviews (${reviewsTotal})` },
  ];

  return (
    <Tabs
      items={items}
      activeValue={activeValue}
      ariaLabel="Product information tabs"
      idBase={idBase}
      onChange={onChange}
    />
  );
}
