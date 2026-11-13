'use client';

import { useMemo } from 'react';
import { Search, ShoppingBag } from 'lucide-react';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import type { StockMovementRow } from './own-product-detail-helpers';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

type Props = Readonly<{
  rows: readonly StockMovementRow[];
  orderId: string;
  onChange: (orderId: string) => void;
  isLoading: boolean;
  isError: boolean;
}>;

//===================================================================

/** Suggestions come exclusively from this product's selected-pharmacy stock history. */
export function StockMovementOrderSearch({
  rows,
  orderId,
  onChange,
  isLoading,
  isError,
}: Props) {
  const options = useMemo(() => {
    const orders = new Map<string, { number: string; comments: Set<string> }>();

    for (const row of rows) {
      if (!row.orderId) continue;

      const order = orders.get(row.orderId) ?? {
        number: row.orderNumber,
        comments: new Set<string>(),
      };

      if (row.comment.trim() && row.comment !== '—')
        order.comments.add(row.comment);

      orders.set(row.orderId, order);
    }

    const result: Array<SearchableSelectOption<string>> = [
      { value: '', label: 'All orders' },
    ];

    for (const [id, order] of orders) {
      result.push({
        value: id,
        label: order.number,
        searchText: `${order.number} ${[...order.comments].join(' ')}`,

        leading: (
          <span className={css.orderSearchIcon} aria-hidden="true">
            <ShoppingBag size={16} />
          </span>
        ),
      });
    }
    return result;
  }, [rows]);

  return (
    <SearchableSelect
      id="stock-movement-order-search"
      label="Order search"
      labelAccessory={
        <InfoTooltip
          label="Order search help"
          title="Order search"
          icon={<ShoppingBag size={20} aria-hidden="true" />}
          escapeOverflow
          preferTopLayer
          items={[
            {
              title: 'Search fields',
              description:
                'Search orders in this product’s stock history by order number or movement comment.',
              icon: <Search size={17} aria-hidden="true" />,
            },
          ]}
        />
      }
      value={orderId}
      options={options}
      placeholder="Order number or comment"
      selectedFallbackLabel={orderId}
      emptyMessage={
        isError
          ? 'Orders could not be loaded.'
          : 'No matching orders in stock movement'
      }
      loadingMessage="Loading orders from stock movement..."
      isOptionsLoading={isLoading}
      disabled={isError}
      error={isError ? 'Order suggestions could not be loaded.' : undefined}
      isActive={Boolean(orderId)}
      pageSize={50}
      onChange={onChange}
    />
  );
}
