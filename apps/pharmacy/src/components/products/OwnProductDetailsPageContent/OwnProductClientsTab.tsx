'use client';

import { useEffect, useState } from 'react';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { PaginationView } from '@e-pharmacy/ui/navigation';

import { getPharmacyClients } from '@/lib/api/browser/clients.api';
import type { PharmacyClientRow } from '@/lib/clients/clients';

import { ClientsTable } from '@/components/clients/ClientsTable/ClientsTable';

import type { ResourceStatus } from './own-product-detail-helpers';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

export function OwnProductClientsTab({
  productId,
}: Readonly<{ productId: string }>) {
  const [clients, setClients] = useState<PharmacyClientRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ResourceStatus>('idle');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) setStatus('loading');
    });

    void getPharmacyClients(
      { scope: 'owner', productId, page, perPage: 20 },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        const pages = Math.max(1, response.totalPages);

        if (page > pages) {
          setPage(pages);
          return;
        }

        setClients([...response.items]);
        setTotal(response.total);
        setTotalPages(pages);
        setStatus('success');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [productId, page, retry]);

  if (status === 'error')
    return (
      <ProfileResourceState
        variant="error"
        title="Clients are temporarily unavailable"
        description="Could not load clients who purchased this product."
        retryLabel="Try again"
        onRetry={() => setRetry((value) => value + 1)}
      />
    );

  if (status !== 'success')
    return (
      <ProfileResourceState
        variant="loading"
        title="Loading product clients"
        description="Finding your clients who ordered this product."
      />
    );

  return (
    <section className={css.sectionCard} aria-label="Product clients">
      <CountLabel shown={clients.length} total={total} label="clients" />
      <ClientsTable
        clients={clients}
        emptyMessage="No clients have ordered this product from your pharmacies."
      />

      <PaginationView
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </section>
  );
}
