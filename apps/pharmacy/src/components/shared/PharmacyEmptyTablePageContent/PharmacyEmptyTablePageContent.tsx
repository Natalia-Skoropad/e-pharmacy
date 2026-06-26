'use client';

import { useMemo, useState } from 'react';

import {
  CountLabel,
  DataTable,
  SearchInput,
  SelectField,
  StatusBanner,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import type { BreadcrumbItem } from '@e-pharmacy/types';
import { CabinetPage } from '@e-pharmacy/ui/common';

import css from './PharmacyEmptyTablePageContent.module.css';

//===================================================================

type EmptyTableKind = 'orders' | 'clients' | 'products' | 'product-requests';

type EmptyRow = { id: string };

type PharmacyEmptyTablePageContentProps = Readonly<{
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  kind: EmptyTableKind;
}>;

//===================================================================

const EMPTY_ITEMS: EmptyRow[] = [];

//===================================================================

const ORDER_COLUMNS: Array<DataTableColumn<EmptyRow>> = [
  { key: 'createdAt', title: 'Created date', render: () => null },
  { key: 'orderNumber', title: 'Order number', render: () => null },
  { key: 'client', title: 'Client', render: () => null },
  { key: 'items', title: 'Items', align: 'center', render: () => null },
  { key: 'amount', title: 'Amount', align: 'right', render: () => null },
  { key: 'payment', title: 'Payment', render: () => null },
  { key: 'delivery', title: 'Delivery', render: () => null },
  { key: 'status', title: 'Status', render: () => null },
];

//===================================================================

const CLIENT_COLUMNS: Array<DataTableColumn<EmptyRow>> = [
  { key: 'name', title: 'Client', render: () => null },
  { key: 'email', title: 'Email', render: () => null },
  { key: 'phone', title: 'Phone', render: () => null },
  { key: 'firstOrderAt', title: 'First order', render: () => null },
  { key: 'ordersCount', title: 'Orders', align: 'center', render: () => null },
  {
    key: 'totalSpent',
    title: 'Total spent',
    align: 'right',
    render: () => null,
  },
  { key: 'status', title: 'Status', render: () => null },
];

//===================================================================

const PRODUCT_COLUMNS: Array<DataTableColumn<EmptyRow>> = [
  { key: 'addedAt', title: 'Added date', render: () => null },
  { key: 'article', title: 'Article', render: () => null },
  { key: 'name', title: 'Name', render: () => null },
  { key: 'category', title: 'Category', render: () => null },
  { key: 'totalQuantity', title: 'Total', align: 'center', render: () => null },
  {
    key: 'reservedQuantity',
    title: 'Reserved',
    align: 'center',
    render: () => null,
  },
  {
    key: 'availableQuantity',
    title: 'Available',
    align: 'center',
    render: () => null,
  },
  { key: 'price', title: 'Price', align: 'right', render: () => null },
  { key: 'status', title: 'Status', render: () => null },
];

//===================================================================

const REQUEST_COLUMNS: Array<DataTableColumn<EmptyRow>> = [
  { key: 'createdAt', title: 'Created date', render: () => null },
  { key: 'article', title: 'Article', render: () => null },
  { key: 'name', title: 'Name', render: () => null },
  { key: 'category', title: 'Category', render: () => null },
  { key: 'status', title: 'Status', render: () => null },
];

//===================================================================

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

//===================================================================

const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'successful', label: 'Successful' },
  { value: 'rejected', label: 'Rejected' },
];

//===================================================================

const REQUEST_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'on_moderation', label: 'On moderation' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

//===================================================================

function getColumns(kind: EmptyTableKind): Array<DataTableColumn<EmptyRow>> {
  switch (kind) {
    case 'orders':
      return ORDER_COLUMNS;
    case 'clients':
      return CLIENT_COLUMNS;
    case 'products':
      return PRODUCT_COLUMNS;
    case 'product-requests':
      return REQUEST_COLUMNS;
  }
}

//===================================================================

function getEmptyText(kind: EmptyTableKind): string {
  switch (kind) {
    case 'orders':
      return 'Orders will appear here after the pharmacy is verified and clients place orders.';
    case 'clients':
      return 'Clients will appear here after verified pharmacy orders are created.';
    case 'products':
      return 'Own products will appear here after verification, when you can add Admin products to your pharmacy.';
    case 'product-requests':
      return 'Product requests will appear here after verification, when request creation becomes available.';
  }
}

//===================================================================

function getInfoText(kind: EmptyTableKind): string {
  switch (kind) {
    case 'orders':
      return 'New pharmacies do not receive orders until Admin verifies the pharmacy profile.';
    case 'clients':
      return 'Client data is connected only to real pharmacy orders, so a new pharmacy starts with an empty client table.';
    case 'products':
      return 'Use All products to review the global catalog. Adding products to your pharmacy becomes available after verification.';
    case 'product-requests':
      return 'Creating product requests is locked for a new pharmacy until verification is complete.';
  }
}

//===================================================================

function getSearchLabel(kind: EmptyTableKind): string {
  return kind === 'clients' ? 'Search by client' : 'Search by name or article';
}

//===================================================================

function getStatusOptions(kind: EmptyTableKind) {
  if (kind === 'orders') return ORDER_STATUS_OPTIONS;
  if (kind === 'product-requests') return REQUEST_STATUS_OPTIONS;
  return STATUS_OPTIONS;
}

//===================================================================

function PharmacyEmptyTablePageContent({
  title,
  description,
  breadcrumbs,
  kind,
}: PharmacyEmptyTablePageContentProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const columns = useMemo(() => getColumns(kind), [kind]);

  return (
    <CabinetPage
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
    >
      <div className={css.stack}>
        <StatusBanner
          status="new"
          label="New"
          title="Verification is required"
          message={getInfoText(kind)}
        />

        <div className={css.toolbar}>
          <div className={`${css.toolbarGrid} ${css.toolbarGridThree}`}>
            <SearchInput
              id={`${kind}-search`}
              label={getSearchLabel(kind)}
              value={search}
              placeholder="Start typing"
              isActive={Boolean(search)}
              onChange={setSearch}
            />

            <SelectField
              id={`${kind}-status`}
              label="Status"
              value={status}
              options={getStatusOptions(kind)}
              isActive={status !== 'all'}
              onChange={setStatus}
            />
          </div>
        </div>

        <CountLabel shown={0} total={0} label="records" />

        <DataTable
          columns={columns}
          items={EMPTY_ITEMS}
          getItemKey={(item) => item.id}
          labels={{ empty: getEmptyText(kind) }}
        />

        {kind === 'product-requests' ? (
          <span className={css.disabledAction} aria-disabled="true">
            Create request is available after verification
          </span>
        ) : null}
      </div>
    </CabinetPage>
  );
}

export default PharmacyEmptyTablePageContent;
export { PharmacyEmptyTablePageContent };
