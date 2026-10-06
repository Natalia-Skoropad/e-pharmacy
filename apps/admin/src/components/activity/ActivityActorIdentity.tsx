import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { formatInitials } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import type { AdminAuditActor } from '@/lib/audit/admin-audit';

import {
  getAdminAuditActorHref,
  getAdminAuditActorTypeLabel,
} from '@/lib/audit/admin-audit-presentation';

import css from './ActivityHistory.module.css';

//===================================================================

type ActivityActorIdentityProps = Readonly<{
  actor: AdminAuditActor | null | undefined;
  actorNameSnapshot: string;
  showPhoto?: boolean;
  showStatus?: boolean;
  photoSize?: number;
}>;

//===================================================================

export function ActivityActorIdentity({
  actor,
  actorNameSnapshot,
  showPhoto = false,
  showStatus = true,
  photoSize = 34,
}: ActivityActorIdentityProps) {
  const href = actor ? getAdminAuditActorHref(actor) : null;
  const actorLabel = actor
    ? `${actorNameSnapshot} (${getAdminAuditActorTypeLabel(actor.actorType)})`
    : actorNameSnapshot;

  const identity = (
    <span className={css.actorIdentityMain}>
      {showPhoto ? (
        <TableImagePreview
          src={actor?.pictureUrl}
          alt={`${actorNameSnapshot} photo`}
          fallback={formatInitials(actorNameSnapshot, 'A')}
          size={photoSize}
        />
      ) : null}

      <span className={css.actorIdentityName}>{actorLabel}</span>
    </span>
  );

  return (
    <span className={css.employeeCell}>
      {href ? (
        <TextActionButton href={href}>{identity}</TextActionButton>
      ) : (
        identity
      )}

      {showStatus ? (
        actor ? (
          <StatusBadge {...USER_STATUS_PRESENTATION[actor.status]} />
        ) : (
          <span className={css.employeeStatusFallback}>Unavailable</span>
        )
      ) : null}
    </span>
  );
}
