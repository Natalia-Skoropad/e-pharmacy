'use client';

import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';

import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { formatInitials } from '@e-pharmacy/ui/data-display';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  ProfileIdentityCard,
  ProfileResourceState,
} from '@e-pharmacy/ui/profile';

import { getAdminAuditActors } from '@/lib/api/browser/admin-audit.api';

import type {
  AdminAuditActor,
  AdminAuditActorType,
} from '@/lib/audit/admin-audit';

import { ADMIN_ROUTES } from '@/lib/routes';

import css from './ActivityEmployeeDetails.module.css';

//===================================================================

type ActivityActorDetailsProps = Readonly<{
  actorId: string;
  actorType: Extract<AdminAuditActorType, 'employee' | 'pharmacyOwner'>;
  pageTitle: string;
  resourceLabel: string;
  roleLabel: string;
}>;

//===================================================================

function ActivityActorDetails({
  actorId,
  actorType,
  pageTitle,
  resourceLabel,
  roleLabel,
}: ActivityActorDetailsProps) {
  const [actor, setActor] = useState<AdminAuditActor | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminAuditActors({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        const matchedActor = response.items.find(
          (item) => item.id === actorId && item.actorType === actorType
        );

        setActor(matchedActor ?? null);
        setStatus(matchedActor ? 'success' : 'error');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [actorId, actorType, retryVersion]);

  return (
    <main className={css.page} aria-labelledby="audit-actor-page-title">
      <section className={css.card}>
        <PageHeader
          title={pageTitle}
          titleId="audit-actor-page-title"
          icon={<UserRound size={23} aria-hidden="true" />}
          actions={
            <TextActionButton href={ADMIN_ROUTES.SETTINGS_ACTIVITY}>
              Activity history
            </TextActionButton>
          }
        />
      </section>

      <section className={css.card} aria-label={`${resourceLabel} card`}>
        {status === 'loading' ? (
          <ProfileResourceState
            variant="loading"
            title={`Loading ${resourceLabel}`}
            description={`Please wait while the ${resourceLabel} profile used by Activity history is loaded.`}
          />
        ) : status === 'error' || !actor ? (
          <ProfileResourceState
            variant="error"
            title={`${pageTitle} could not be loaded`}
            description={`The ${resourceLabel} may no longer be available, or the profile could not be loaded right now.`}
            retryLabel="Try again"
            onRetry={() => {
              setStatus('loading');
              setRetryVersion((value) => value + 1);
            }}
          />
        ) : (
          <div className={css.profileGrid}>
            <ProfileIdentityCard
              name={actor.name}
              email={actor.email}
              roleLabel={roleLabel}
              statusLabel={USER_STATUS_PRESENTATION[actor.status].label}
              ariaLabel={`${actor.name} ${resourceLabel} summary`}
              pictureEditor={
                <TableImagePreview
                  className={css.employeePhoto}
                  src={actor.pictureUrl}
                  alt={`${actor.name} photo`}
                  fallback={formatInitials(actor.name, 'A')}
                  size={96}
                />
              }
              details={[
                {
                  label:
                    actorType === 'pharmacyOwner' ? 'Owner ID' : 'Employee ID',
                  value: actor.id,
                },
                { label: 'Phone', value: actor.phone || '—' },
              ]}
            />

            <section
              className={css.contextCard}
              aria-labelledby="audit-actor-context-title"
            >
              <h2 id="audit-actor-context-title">Activity context</h2>
              <p>
                This read-only card shows the {resourceLabel} identity currently
                linked to Activity history records. The audit rows themselves
                keep the original name snapshot saved when each change occurred.
              </p>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

//===================================================================

type ActivityEmployeeDetailsProps = Readonly<{
  employeeId: string;
}>;

//===================================================================

export function ActivityEmployeeDetails({
  employeeId,
}: ActivityEmployeeDetailsProps) {
  return (
    <ActivityActorDetails
      actorId={employeeId}
      actorType="employee"
      pageTitle="Employee details"
      resourceLabel="employee"
      roleLabel="Admin employee"
    />
  );
}

//===================================================================

type ActivityPharmacyOwnerDetailsProps = Readonly<{
  ownerId: string;
}>;

//===================================================================

export function ActivityPharmacyOwnerDetails({
  ownerId,
}: ActivityPharmacyOwnerDetailsProps) {
  return (
    <ActivityActorDetails
      actorId={ownerId}
      actorType="pharmacyOwner"
      pageTitle="Pharmacy owner details"
      resourceLabel="pharmacy owner"
      roleLabel="Pharmacy owner"
    />
  );
}
