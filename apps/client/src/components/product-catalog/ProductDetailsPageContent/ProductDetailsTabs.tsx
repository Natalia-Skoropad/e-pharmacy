'use client';

import { Building2, FileText, Package, Star } from 'lucide-react';

import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';

import {
  PRODUCT_TAB_LABELS,
  type ProductTab,
} from '@/lib/routes/product-detail-tabs';

export type { ProductTab } from '@/lib/routes/product-detail-tabs';

//===================================================================

export type ProductDetailsTabsProps = Readonly<{
  idBase: string;
  activeValue: ProductTab;
  onChange: (value: ProductTab) => void;
}>;

//===================================================================

export function ProductDetailsTabs({
  idBase,
  activeValue,
  onChange,
}: ProductDetailsTabsProps) {
  const items: TabItem<ProductTab>[] = [
    {
      value: 'details',
      label: PRODUCT_TAB_LABELS.details,
      icon: <Package size={17} aria-hidden="true" />,
    },
    {
      value: 'pharmacies',
      label: PRODUCT_TAB_LABELS.pharmacies,
      icon: <Building2 size={17} aria-hidden="true" />,
    },
    {
      value: 'characteristics',
      label: PRODUCT_TAB_LABELS.characteristics,
      icon: <FileText size={17} aria-hidden="true" />,
    },
    {
      value: 'reviews',
      label: PRODUCT_TAB_LABELS.reviews,
      icon: <Star size={17} aria-hidden="true" />,
    },
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
