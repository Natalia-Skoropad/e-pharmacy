'use client';

import { WorkingHours } from '@e-pharmacy/ui/data-display';

import {
  PharmacyBlockSourceBadge,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import { ResponsivePhoto } from '@e-pharmacy/ui/media';

import type { AdminAuditValue } from '@/lib/audit/admin-audit';

import {
  formatAdminAuditValue,
  getAdminAuditStatusPresentation,
} from '@/lib/audit/admin-audit-presentation';

import { getAuditColorSwatch } from '@/lib/audit/admin-audit-fields';

import { AuditLongText } from './AuditLongText';

import css from './ActivityHistory.module.css';

//===================================================================

export function RenderAuditValue({
  value,
  field,
  isStatus = false,
  photoUrl,
  blockSource,
}: Readonly<{
  value: AdminAuditValue | undefined;
  field: string;
  isStatus?: boolean;
  photoUrl?: string | null;
  blockSource?: 'owner_deactivated' | 'admin_blocked';
}>) {
  const color = getAuditColorSwatch(value);

  const status =
    isStatus && typeof value === 'string'
      ? getAdminAuditStatusPresentation(value)
      : null;

  return (
    <div className={css.changeValue}>
      {color ? (
        <span
          className={css.colorSwatch}
          style={{ backgroundColor: color }}
          aria-label={`Color ${color}`}
        />
      ) : null}
      {field === 'photoFingerprint' ? (
        photoUrl ? (
          <span className={css.auditPhotoPreview}>
            <ResponsivePhoto
              preset="table"
              src={photoUrl}
              alt="Pharmacy photo at this change"
              sizes="110px"
              unoptimized
            />
          </span>
        ) : (
          <span className={css.auditPhotoUnavailable}>
            {value === null
              ? 'No pharmacy photo'
              : 'Historical photo preview unavailable'}
          </span>
        )
      ) : status ? (
        <>
          <StatusBadge {...status} />
          <PharmacyBlockSourceBadge
            status={typeof value === 'string' ? value : ''}
            blockSource={blockSource}
          />
        </>
      ) : field === 'workingHours' &&
        typeof value === 'string' &&
        value.trim() ? (
        <WorkingHours value={value} />
      ) : [
          'description',
          'shortDescription',
          'text',
          'fullDescription',
          'pharmacyComment',
        ].includes(field) && typeof value === 'string' ? (
        <AuditLongText key={value} value={value} />
      ) : (
        formatAdminAuditValue(value)
      )}
    </div>
  );
}
