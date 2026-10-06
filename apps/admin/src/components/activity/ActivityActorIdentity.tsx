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
  statusPlacement?: 'stacked' | 'inline';
}>;

//===================================================================

export function ActivityActorIdentity({
  actor,
  actorNameSnapshot,
  showPhoto = false,
  showStatus = true,
  photoSize = 34,
  statusPlacement = 'stacked',
}: ActivityActorIdentityProps) {
  const href = actor ? getAdminAuditActorHref(actor) : null;
  const actorLabel = actor
    ? `${actorNameSnapshot} (${getAdminAuditActorTypeLabel(actor.actorType)})`
    : actorNameSnapshot;

  const status = showStatus ? (
    actor ? (
      <StatusBadge {...USER_STATUS_PRESENTATION[actor.status]} />
    ) : (
      <span className={css.employeeStatusFallback}>Unavailable</span>
    )
  ) : null;

  const isInlineStatus = statusPlacement === 'inline';

  const name = href ? (
    <TextActionButton className={css.actorIdentityNameLink} href={href}>
      {actorLabel}
    </TextActionButton>
  ) : (
    <span className={css.actorIdentityName}>{actorLabel}</span>
  );

  return (
    <span className={css.employeeCell}>
      <span
        className={`${css.actorIdentityMain} ${
          isInlineStatus ? css.actorIdentityMainInline : ''
        }`}
      >
        {showPhoto ? (
          <TableImagePreview
            className={css.actorIdentityPhoto}
            src={actor?.pictureUrl}
            alt={`${actorNameSnapshot} photo`}
            fallback={formatInitials(actorNameSnapshot, 'A')}
            size={photoSize}
          />
        ) : null}

        <span
          className={`${css.actorIdentityCopy} ${
            isInlineStatus ? css.actorIdentityCopyInline : ''
          }`}
        >
          <span
            className={`${css.actorIdentityNameRow} ${
              isInlineStatus ? css.actorIdentityNameRowInline : ''
            }`}
          >
            {name}
            {isInlineStatus ? status : null}
          </span>

          {statusPlacement === 'stacked' ? status : null}
        </span>
      </span>
    </span>
  );
}
