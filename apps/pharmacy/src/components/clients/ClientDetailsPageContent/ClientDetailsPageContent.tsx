'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, UserRound, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  ButtonLink,
  CountLabel,
  DataTable,
  LoadingSpinner,
  ShimmerImage,
  Tabs,
  TextActionButton,
  type DataTableColumn,
  type TabItem,
} from '@e-pharmacy/ui/common';

import { EntityComments } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyClientDetails,
  getPharmacyNotes,
  getPharmacyOrders,
} from '@/lib/api/browser';

import type { PharmacyClientRow } from '@/lib/clients/clients';

import {
  getPharmacyOrderPath,
  getPharmacyClientsPath,
} from '@/lib/layout/routes';

import {
  ORDER_STATUS_LABELS,
  type PharmacyOrderRow,
} from '@/lib/orders/orders';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type ClientDetailsPageContentProps = Readonly<{ clientId: string }>;

//===================================================================

type ClientTab = 'details' | 'orders' | 'comments';

//===================================================================

const CLIENT_TABS: Array<TabItem<ClientTab>> = [
  { value: 'details', label: 'Details' },
  { value: 'orders', label: 'Orders' },
  { value: 'comments', label: 'Comments' },
];

//===================================================================

function formatClientDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Not specified'
    : formatShortDate(value);
}

//===================================================================

function ClientDetailsPageContent({ clientId }: ClientDetailsPageContentProps) {
  const [client, setClient] = useState<PharmacyClientRow | null>(null);
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeTab, setActiveTab] = useState<ClientTab>('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const loadedClient = await getPharmacyClientDetails(clientId);
        const ordersResponse = await getPharmacyOrders({
          page: 1,
          perPage: 100,
          client: loadedClient.name,
        });
        if (mounted) {
          setClient(loadedClient);
          setOrders(
            ordersResponse.items.filter((order) => order.clientId === clientId)
          );
          setTotalOrders(
            ordersResponse.items.filter((order) => order.clientId === clientId)
              .length
          );
        }
      } catch {
        if (mounted) setError('Could not load client details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  const successfulOrders = orders.filter(
    (order) => order.status === 'successful'
  );
  const inProgressOrders = orders.filter(
    (order) => order.status === 'in_progress'
  );
  const newOrders = orders.filter((order) => order.status === 'new');
  const rejectedOrders = orders.filter((order) => order.status === 'rejected');

  const tabs = useMemo(
    () =>
      CLIENT_TABS.map((tab) =>
        tab.value === 'orders'
          ? { ...tab, label: `Orders (${totalOrders})` }
          : tab.value === 'comments'
            ? { ...tab, label: 'Comments' }
            : tab
      ),
    [totalOrders]
  );

  const columns: Array<DataTableColumn<PharmacyOrderRow>> = [
    {
      key: 'date',
      title: 'Order date',
      render: (order) => formatShortDate(order.orderDate),
    },
    {
      key: 'number',
      title: 'Order number',
      render: (order) => (
        <TextActionButton href={getPharmacyOrderPath(order.id)}>
          {order.orderNumber}
        </TextActionButton>
      ),
    },
    {
      key: 'quantity',
      title: 'Order quantity',
      render: (order) => order.totalQuantity,
    },
    {
      key: 'amount',
      title: 'Order amount',
      render: (order) => formatPrice(order.totalAmount),
    },
    {
      key: 'status',
      title: 'Order status',
      render: (order) => (
        <StatusBadge
          status={order.status}
          label={ORDER_STATUS_LABELS[order.status]}
        />
      ),
    },
  ];

  if (loading)
    return (
      <main className={css.page}>
        <section className={css.contentCard}>
          <LoadingSpinner label="Loading client..." />
        </section>
      </main>
    );
  if (error || !client)
    return (
      <main className={css.page}>
        <section className={css.contentCard}>
          <p>{error || 'Client not found.'}</p>
          <ButtonLink
            href={getPharmacyClientsPath()}
            renderLink={({ href, className, children, ...props }) => (
              <Link href={href} className={className} {...props}>
                {children}
              </Link>
            )}
          >
            Back to clients
          </ButtonLink>
        </section>
      </main>
    );

  return (
    <main className={css.page} aria-labelledby="client-details-page-title">
      <section className={css.contentCard}>
        <PageHeader
          title={client.name}
          titleId="client-details-page-title"
          icon={<Users size={23} aria-hidden="true" />}
        />
        <div className={css.profileGrid}>
          <div className={css.avatarWrap}>
            {client.photoUrl ? (
              <ShimmerImage
                src={client.photoUrl}
                alt={client.name}
                className={css.avatar}
                sizes="(max-width: 767px) calc(100vw - 56px), 150px"
                unoptimized
              />
            ) : (
              <UserRound size={48} />
            )}
          </div>
          <div className={css.clientInfo}>
            <p>
              <Mail size={18} />
              <a href={`mailto:${client.email}`}>{client.email}</a>
            </p>
            <p>
              <Phone size={18} />
              <a href={`tel:${client.phone}`}>{client.phone}</a>
            </p>
            <p>
              <MapPin size={18} />
              <span>{client.address}</span>
            </p>
            <p>
              <strong>First order:</strong>{' '}
              {formatClientDate(client.firstOrderAt)}
            </p>

            <StatusBadge
              status={client.status}
              label={client.status === 'active' ? 'Active' : 'Blocked'}
            />

            {client.status === 'blocked' && client.statusReason ? (
              <div className={css.statusReason}>
                <strong>Inactive reason</strong>
                <p>{client.statusReason}</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className={css.statistics}>
          <article className={css.infoCard}>
            <span>All orders</span>
            <strong>{orders.length}</strong>
            <small>
              {formatPrice(
                orders.reduce((sum, order) => sum + order.totalAmount, 0)
              )}
            </small>
          </article>
          <article className={css.warningCard}>
            <span>In progress</span>
            <strong>{inProgressOrders.length}</strong>
            <small>
              {formatPrice(
                inProgressOrders.reduce(
                  (sum, order) => sum + order.totalAmount,
                  0
                )
              )}
            </small>
          </article>
          <article className={css.successCard}>
            <span>Successful</span>
            <strong>{successfulOrders.length}</strong>
            <small>
              {formatPrice(
                successfulOrders.reduce(
                  (sum, order) => sum + order.totalAmount,
                  0
                )
              )}
            </small>
          </article>
          <article className={css.errorCard}>
            <span>Rejected</span>
            <strong>{rejectedOrders.length}</strong>
            <small>
              {formatPrice(
                rejectedOrders.reduce(
                  (sum, order) => sum + order.totalAmount,
                  0
                )
              )}
            </small>
          </article>
          <article className={css.infoCard}>
            <span>New</span>
            <strong>{newOrders.length}</strong>
            <small>
              {formatPrice(
                newOrders.reduce((sum, order) => sum + order.totalAmount, 0)
              )}
            </small>
          </article>
        </div>
      </section>

      <section className={css.contentCard}>
        <Tabs
          items={tabs}
          activeValue={activeTab}
          ariaLabel="Client details tabs"
          mobileVisibleCount={1}
          tabletVisibleCount={3}
          onChange={setActiveTab}
        />
        <div className={css.tabPanel}>
          {activeTab === 'details' ? (
            <section className={css.detailsCard}>
              <h2>Client details</h2>
              <dl>
                <div>
                  <dt>Client ID</dt>
                  <dd>{client.id}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{client.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{client.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{client.phone}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{client.address}</dd>
                </div>
                {client.status === 'blocked' && client.statusReason ? (
                  <div>
                    <dt>Inactive reason</dt>
                    <dd>{client.statusReason}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}
          {activeTab === 'orders' ? (
            <section className={css.tableCard}>
              <div className={css.sectionHead}>
                <h2>Client orders</h2>
                <CountLabel
                  shown={orders.length}
                  total={orders.length}
                  label="orders"
                />
              </div>
              <DataTable
                columns={columns}
                items={orders}
                getItemKey={(order) => String(order.id)}
                minWidth={760}
                labels={{ empty: 'No orders found for this client.' }}
              />
            </section>
          ) : null}
          {activeTab === 'comments' ? (
            <EntityComments
              entityKey={`client:${clientId}`}
              load={(page) => getPharmacyNotes('client', clientId, page)}
              create={(text) => createPharmacyNote('client', clientId, text)}
              remove={(id) => deletePharmacyNote('client', clientId, id)}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default ClientDetailsPageContent;
export { ClientDetailsPageContent };
