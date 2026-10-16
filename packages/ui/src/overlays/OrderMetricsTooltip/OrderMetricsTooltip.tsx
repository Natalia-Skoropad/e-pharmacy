'use client';

import { ListOrdered, ShoppingBag, Wallet } from 'lucide-react';

import { InfoTooltip } from '../InfoTooltip';

//===================================================================

type OrderMetricsTooltipProps = Readonly<{
  scope: 'pharmacy' | 'client';
  preferTopLayer?: boolean;
}>;

//===================================================================

/** Both tables report only orders with the final `successful` status. */
export function OrderMetricsTooltip({
  scope,
  preferTopLayer = false,
}: OrderMetricsTooltipProps) {
  const subject = scope === 'pharmacy' ? 'this pharmacy' : 'this client';

  return (
    <InfoTooltip
      label="How are order totals calculated?"
      title="Successful orders"
      icon={<ShoppingBag size={20} aria-hidden="true" />}
      escapeOverflow
      preferTopLayer={preferTopLayer}
      items={[
        {
          title: 'Orders count',
          description: `Number of orders for ${subject} with status Successful. Other order statuses are not counted.`,
          icon: <ListOrdered size={17} aria-hidden="true" />,
        },
        {
          title: 'Orders amount',
          description: `Sum of the order totals (₴) for ${subject} with status Successful. Pending, cancelled and other orders are excluded.`,
          icon: <Wallet size={17} aria-hidden="true" />,
        },
      ]}
    />
  );
}
