import type { ReactNode } from 'react';

import {
  Archive,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  SlidersHorizontal,
  ShoppingBag,
  Warehouse,
} from 'lucide-react';

import type { SelectOption } from '@e-pharmacy/ui/forms';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { ORDER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { OrderStatus } from '@e-pharmacy/types/orders';

import type {
  StockMovementEventType,
  StockMovementSource,
} from '@e-pharmacy/types/products';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

function Option({ icon, label }: Readonly<{ icon: ReactNode; label: string }>) {
  return (
    <span className={css.stockFilterOption}>
      <span className={css.stockFilterOptionIcon}>{icon}</span>
      {label}
    </span>
  );
}

//===================================================================

export const STOCK_EVENT_FILTER_OPTIONS: Array<
  SelectOption<'all' | StockMovementEventType>
> = [
  { value: 'all', label: 'All events' },
  {
    value: 'arrival',
    label: 'Stock arrival',
    content: <Option icon={<PackagePlus size={16} />} label="Stock arrival" />,
  },
  {
    value: 'reserve',
    label: 'Reserved in order',
    content: <Option icon={<Archive size={16} />} label="Reserved in order" />,
  },
  {
    value: 'write_off',
    label: 'Stock write-off',
    content: (
      <Option icon={<PackageMinus size={16} />} label="Stock write-off" />
    ),
  },
  {
    value: 'release',
    label: 'Reserve released',
    content: <Option icon={<RotateCcw size={16} />} label="Reserve released" />,
  },
  {
    value: 'adjustment',
    label: 'Stock adjustment',

    content: (
      <Option icon={<SlidersHorizontal size={16} />} label="Stock adjustment" />
    ),
  },
];

//===================================================================

export const STOCK_SOURCE_FILTER_OPTIONS: Array<
  SelectOption<'all' | StockMovementSource>
> = [
  { value: 'all', label: 'All sources' },
  {
    value: 'pharmacy_stock',
    label: 'Pharmacy stock',
    content: <Option icon={<Warehouse size={16} />} label="Pharmacy stock" />,
  },
  {
    value: 'client_order',
    label: 'Client order',
    content: <Option icon={<ShoppingBag size={16} />} label="Client order" />,
  },
];

//===================================================================

export const STOCK_ORDER_STATUS_FILTER_OPTIONS: Array<
  SelectOption<'all' | OrderStatus>
> = [
  { value: 'all', label: 'All statuses' },

  ...(['new', 'in_progress', 'successful', 'rejected'] as const).map(
    (status) => ({
      value: status,
      label: ORDER_STATUS_PRESENTATION[status].label,
      content: <StatusBadge {...ORDER_STATUS_PRESENTATION[status]} />,
    })
  ),
];
