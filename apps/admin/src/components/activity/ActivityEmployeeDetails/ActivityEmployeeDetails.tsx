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
import type { AdminAuditActor } from '@/lib/audit/admin-audit';
import { ADMIN_ROUTES } from '@/lib/routes';

import css from './ActivityEmployeeDetails.module.css';

//===================================================================

type ActivityEmployeeDetailsProps = Readonly<{
  employeeId: string;
}>;

//===================================================================

export function ActivityEmployeeDetails({
  employeeId,
}: ActivityEmployeeDetailsProps) {
  const [employee, setEmployee] = useState<AdminAuditActor | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminAuditActors({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        const matchedEmployee = response.items.find(
          (item) => item.id === employeeId
        );

        setEmployee(matchedEmployee ?? null);
        setStatus(matchedEmployee ? 'success' : 'error');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [employeeId, retryVersion]);

  return (
    <main className={css.page} aria-labelledby="audit-employee-page-title">
      <section className={css.card}>
        <PageHeader
          title="Employee details"
          titleId="audit-employee-page-title"
          icon={<UserRound size={23} aria-hidden="true" />}
          actions={
            <TextActionButton href={ADMIN_ROUTES.SETTINGS_ACTIVITY}>
              Activity history
            </TextActionButton>
          }
        />
      </section>

      <section className={css.card} aria-label="Employee card">
        {status === 'loading' ? (
          <ProfileResourceState
            variant="loading"
            title="Loading employee"
            description="Please wait while the employee profile used by Activity history is loaded."
          />
        ) : status === 'error' || !employee ? (
          <ProfileResourceState
            variant="error"
            title="Employee could not be loaded"
            description="The employee may no longer be available, or the profile could not be loaded right now."
            retryLabel="Try again"
            onRetry={() => {
              setStatus('loading');
              setRetryVersion((value) => value + 1);
            }}
          />
        ) : (
          <div className={css.profileGrid}>
            <ProfileIdentityCard
              name={employee.name}
              email={employee.email}
              roleLabel="Admin employee"
              statusLabel={USER_STATUS_PRESENTATION[employee.status].label}
              ariaLabel={`${employee.name} employee summary`}
              pictureEditor={
                <TableImagePreview
                  className={css.employeePhoto}
                  src={employee.pictureUrl}
                  alt={`${employee.name} photo`}
                  fallback={formatInitials(employee.name, 'A')}
                  size={96}
                />
              }
              details={[
                { label: 'Employee ID', value: employee.id },
                { label: 'Phone', value: employee.phone || '—' },
                { label: 'Address', value: employee.address || '—' },
              ]}
            />

            <section
              className={css.contextCard}
              aria-labelledby="audit-employee-context-title"
            >
              <h2 id="audit-employee-context-title">Activity context</h2>
              <p>
                This read-only card shows the employee identity currently linked
                to Activity history records. The audit rows themselves keep the
                original employee-name snapshot saved when each change occurred.
              </p>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
