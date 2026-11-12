import { useMemo } from 'react';
import { ShoppingBag, Boxes, Wallet } from 'lucide-react';

import {
  DataTable,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { InfoTooltip, OrderMetricsTooltip } from '@e-pharmacy/ui/overlays';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatAmount } from '@e-pharmacy/utils/money';

import { getPharmacyClientPath } from '@/lib/routes';
import type { PharmacyClientRow } from '@/lib/clients/clients';
import { getClientDisplayName } from '@/lib/clients/client-display-name';
import { getProductImageSrc } from '@/lib/products/product-images';

import css from './ClientsTable.module.css';

//===================================================================

type ClientsTableProps = Readonly<{
  clients: PharmacyClientRow[];
  emptyMessage: string;
  isLoading?: boolean;
  showProductQuantity?: boolean;
}>;

//===================================================================

function FirstOrderDate({ value }: Readonly<{ value: string }>) {
  if (!value) return 'Not specified';

  return <TableDateTime value={value} />;
}

//===================================================================

function ClientsTable({
  clients,
  emptyMessage,
  isLoading = false,
  showProductQuantity = false,
}: ClientsTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyClientRow>>>(() => {
    const clientHref = (client: PharmacyClientRow) =>
      getPharmacyClientPath(client.id);

    return [
      {
        key: 'firstOrderAt',
        title: <TableHeaderTitle parts={['Client', 'added']} />,
        render: (client) => <FirstOrderDate value={client.firstOrderAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Client', 'photo']} />,

        render: (client) => (
          <TableImagePreview
            src={getProductImageSrc(client.photoUrl ?? undefined)}
            alt={`${client.name} photo`}
            fallback={formatInitials(client.name, 'C')}
          />
        ),
      },
      {
        key: 'clientId',
        title: <TableHeaderTitle parts={['Client', 'ID']} />,

        render: (client) => (
          <TextActionButton
            className={css.breakableLink}
            href={clientHref(client)}
          >
            {client.id}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Client', 'name']} />,

        render: (client) => (
          <TextActionButton href={clientHref(client)}>
            {getClientDisplayName(client)}
          </TextActionButton>
        ),
      },
      {
        key: 'email',
        title: <TableHeaderTitle parts={['Client', 'email']} />,

        render: (client) => (
          <span className={css.breakableText}>{client.email || '—'}</span>
        ),
      },
      {
        key: 'phone',
        title: <TableHeaderTitle parts={['Client', 'phone']} />,
        render: (client) => client.phone || '—',
      },
      {
        key: 'address',
        title: <TableHeaderTitle parts={['Client', 'address']} />,
        render: (client) => client.address || '—',
      },
      {
        key: 'successfulOrdersCount',

        title: (
          <span className={css.headerWithHelp}>
            <TableHeaderTitle parts={['Orders', 'count']} />
            {showProductQuantity ? (
              <InfoTooltip
                label="Product orders count explanation"
                title="Product purchase metrics"
                icon={<ShoppingBag size={20} aria-hidden="true" />}
                escapeOverflow
                preferTopLayer
                items={[
                  {
                    title: 'Successful orders',
                    description:
                      'Number of completed orders containing this product. Each order counts once, regardless of quantity.',
                    icon: <ShoppingBag size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Products quantity',
                    description:
                      'Total units of this product across the client’s successful orders, not the number of orders.',
                    icon: <Boxes size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Orders amount, ₴',
                    description:
                      'Sum of this product’s line totals in completed orders, excluding other products in those orders.',
                    icon: <Wallet size={17} aria-hidden="true" />,
                  },
                ]}
              />
            ) : (
              <OrderMetricsTooltip scope="client" preferTopLayer />
            )}
          </span>
        ),

        render: (client) => client.successfulOrdersCount,
      },
      ...(showProductQuantity
        ? [
            {
              key: 'productQuantity',
              title: <TableHeaderTitle parts={['Products', 'quantity']} />,
              render: (client: PharmacyClientRow) =>
                client.productQuantity ?? 0,
            } satisfies DataTableColumn<PharmacyClientRow>,
          ]
        : []),
      {
        key: 'successfulOrdersAmount',
        title: <TableHeaderTitle parts={['Orders', 'amount, ₴']} />,
        render: (client) => formatAmount(client.successfulOrdersAmount) ?? '—',
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Client', 'status']} />,

        render: (client) => (
          <StatusBadge {...USER_STATUS_PRESENTATION[client.status]} />
        ),
      },
    ];
  }, [showProductQuantity]);

  return (
    <DataTable
      columns={columns}
      items={clients}
      getItemKey={(client) => client.id}
      isLoading={isLoading}
      minWidth={960}
      labels={{
        loading: 'Loading clients...',
        empty: emptyMessage,
      }}
    />
  );
}

export default ClientsTable;
export { ClientsTable };
