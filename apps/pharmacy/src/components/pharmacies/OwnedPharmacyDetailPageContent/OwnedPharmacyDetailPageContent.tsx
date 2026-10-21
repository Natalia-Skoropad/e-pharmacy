'use client';

import { useEffect, useState } from 'react';
import { Building2, ArrowLeft } from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type { OwnedPharmacyDetailResponse } from '@e-pharmacy/types/pharmacies';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatPharmacyLocation } from '@e-pharmacy/utils';

import { getOwnedPharmacyDetail } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { PHARMACY_ROUTES } from '@/lib/routes';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';

import { OwnedPharmacyEditor } from '../OwnedPharmacyEditor/OwnedPharmacyEditor';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

// Stage 14.18.9: read-only scoped destination. Editing and the full tabbed
// Pharmacy view arrive in Stage 14.18.11; never use implicit /me/profile here.
export function OwnedPharmacyDetailPageContent({
  pharmacyId,
}: Readonly<{ pharmacyId: string }>) {
  const [retry, setRetry] = useState(0);

  const [result, setResult] = useState<OwnedPharmacyDetailResponse | null>(
    null
  );

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void getOwnedPharmacyDetail(pharmacyId, { signal: controller.signal })
      .then((value) => {
        if (controller.signal.aborted) return;

        setResult(value);
        setError('');
        setLoading(false);
        dispatchPharmacyBreadcrumbLabel(value.pharmacy.name);
      })

      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setResult(null);
        setLoading(false);

        setError(
          isApiError(cause) &&
            (cause.httpStatus === 403 || cause.httpStatus === 404)
            ? 'This pharmacy is unavailable or you do not have access to it.'
            : 'Could not load this pharmacy. Please try again.'
        );
      });

    return () => controller.abort();
  }, [pharmacyId, retry]);

  if (
    !loading &&
    !error &&
    result?.pharmacy.status === 'new' &&
    result.pharmacy.membershipRole === 'owner'
  ) {
    return <OwnedPharmacyEditor pharmacyId={pharmacyId} />;
  }

  return (
    <main className={css.page} aria-labelledby="owned-pharmacy-title">
      <section className={css.card}>
        <TextActionButton href={PHARMACY_ROUTES.PHARMACIES}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to pharmacies
        </TextActionButton>

        <PageHeader
          title={result?.pharmacy.name || 'Pharmacy'}
          titleId="owned-pharmacy-title"
          icon={<Building2 size={23} aria-hidden="true" />}
        />
        {loading ? (
          <ProfileResourceState
            variant="loading"
            title="Loading pharmacy"
            description="Retrieving your pharmacy information."
          />
        ) : error ? (
          <ProfileResourceState
            variant="error"
            title="Pharmacy unavailable"
            description={error}
            onRetry={() => {
              setLoading(true);
              setRetry((n) => n + 1);
            }}
          />
        ) : result ? (
          <>
            <dl className={css.details}>
              <div>
                <dt>Pharmacy ID</dt>
                <dd>{result.pharmacy.id}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge
                    {...PHARMACY_STATUS_PRESENTATION[result.pharmacy.status]}
                  />
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {formatPharmacyLocation(result.pharmacy.location) ||
                    'Not specified yet'}
                </dd>
              </div>
              <div>
                <dt>Contact email</dt>
                <dd>{result.pharmacy.email || '—'}</dd>
              </div>
              <div>
                <dt>Contact phone</dt>
                <dd>{result.pharmacy.phone || '—'}</dd>
              </div>
            </dl>
            <p className={css.note}>
              Pharmacy management tabs will be added in Stage 14.18.11.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
