'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Ban,
  ChevronDown,
  ClipboardCheck,
  RefreshCw,
  ClipboardEdit,
  CheckCircle2,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { useToast } from '@e-pharmacy/ui/feedback';
import { ReasonModal } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  decideAdminPharmacyModeration,
  getAdminPharmacyDetail,
} from '@/lib/api/browser/admin-pharmacy-detail.api';

import {
  getPharmacyModerationOptions,
  validatePharmacyModerationReason,
  PHARMACY_MODERATION_REASON_MAX_LENGTH,
  type PharmacyModerationOption,
} from '@/lib/pharmacies/pharmacy-moderation-actions';

import { requestPharmacyModerationRefresh } from '@/lib/pharmacies/pharmacy-moderation-refresh';
import { requestPharmacyOwnerNavigationBadgeRefresh } from '@/lib/pharmacy-owners/pharmacy-owner-navigation-badge-refresh';

import css from './PharmacyModerationActions.module.css';

//===================================================================

type ActionState = Readonly<{
  option: PharmacyModerationOption;
  reason: string;
  expectedRevision: string;
  clientRequestId: string;
  requestError: string;
  conflict: boolean;
}>;

type Props = Readonly<{
  detail: AdminPharmacyDetail;
  onRefresh: () => void;
  onDetailRefreshed: (fresh: AdminPharmacyDetail) => void;
}>;

//===================================================================

function getMutationError(error: unknown): {
  message: string;
  conflict: boolean;
} {
  if (!isApiError(error))
    return {
      message:
        'Could not submit this moderation decision. Retry using the same request ID.',
      conflict: false,
    };

  if (error.httpStatus === 409 && /unfinished orders/i.test(error.message))
    return {
      message:
        'This pharmacy cannot be blocked while it has unfinished orders. Finish or cancel new/in-progress orders, refresh the details and retry.',
      conflict: true,
    };

  if (error.httpStatus === 409)
    return {
      message:
        'The pharmacy was changed or the decision is not valid anymore. Refresh its details before submitting another decision. If an earlier request succeeded, do not submit it twice.',
      conflict: true,
    };

  if (error.httpStatus === 403)
    return {
      message: 'You no longer have permission to moderate this pharmacy.',
      conflict: true,
    };

  if (error.httpStatus === 404)
    return { message: 'This pharmacy no longer exists.', conflict: true };

  if (error.httpStatus === 400)
    return {
      message:
        'The server rejected this decision. Check the reason and refresh the pharmacy details.',
      conflict: true,
    };

  if (
    error.transportCode === 'NETWORK_ERROR' ||
    error.transportCode === 'TIMEOUT'
  )
    return {
      message:
        'Network failure or timeout. Retrying with the same request ID is safe.',
      conflict: false,
    };

  return {
    message: 'Could not complete this decision. Please retry.',
    conflict: false,
  };
}

//===================================================================

export function PharmacyModerationActions({
  detail,
  onRefresh,
  onDetailRefreshed,
}: Props) {
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [action, setAction] = useState<ActionState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const options = getPharmacyModerationOptions(detail);

  // A changed pharmacy or revision must never inherit the previous open dropdown.
  // Deriving visibility avoids a synchronous setState in an effect.
  const menuKey = JSON.stringify([
    detail.id,
    detail.status,
    detail.reviewState,
    detail.owner?.status,
    detail.dates.updatedAt,
  ]);
  const menuOpen = options.length > 0 && openMenuKey === menuKey;

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node))
        setOpenMenuKey(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuKey(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  if (options.length === 0 && !action) return null;

  const reasonError = action
    ? validatePharmacyModerationReason(action.reason)
    : '';

  const selectAction = (option: PharmacyModerationOption) => {
    setOpenMenuKey(null);

    setAction({
      option,
      reason: '',
      expectedRevision: detail.dates.updatedAt,
      clientRequestId: crypto.randomUUID(),
      requestError: '',
      conflict: false,
    });
  };

  const refreshConflict = async () => {
    if (!action || isRefreshing || isSubmitting) return;
    setIsRefreshing(true);

    try {
      const fresh = await getAdminPharmacyDetail(detail.id);
      onDetailRefreshed(fresh);

      const option = getPharmacyModerationOptions(fresh).find(
        ({ action: candidate }) => candidate === action.option.action
      );

      if (!option) {
        setAction(
          (current) =>
            current && {
              ...current,
              requestError:
                'This decision is no longer available. Close the dialog and select a valid action.',
              conflict: true,
            }
        );
      } else {
        setAction(
          (current) =>
            current && {
              ...current,
              option,
              expectedRevision: fresh.dates.updatedAt,
              clientRequestId: crypto.randomUUID(),
              requestError: '',
              conflict: false,
            }
        );
      }
    } catch {
      setAction(
        (current) =>
          current && {
            ...current,
            requestError:
              'Could not reload the pharmacy. Check your connection and try refreshing again.',
            conflict: true,
          }
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const submitDecision = async () => {
    if (
      !action ||
      inFlight.current ||
      action.conflict ||
      reasonError ||
      isRefreshing
    )
      return;

    inFlight.current = true;
    setIsSubmitting(true);
    setAction((current) => current && { ...current, requestError: '' });

    try {
      await decideAdminPharmacyModeration(detail.id, {
        action: action.option.action,
        reason: action.reason.trim(),
        expectedRevision: action.expectedRevision,
        clientRequestId: action.clientRequestId,
      });

      // Mutations already record an audit event transactionally in the API.
      setAction(null);
      setOpenMenuKey(null);
      onRefresh();
      requestPharmacyModerationRefresh();
      requestPharmacyOwnerNavigationBadgeRefresh();

      toast.success(
        action.option.action === 'request_corrections'
          ? 'Corrections were requested. The owner can view the feedback.'
          : `${action.option.label} completed successfully.`
      );
    } catch (error: unknown) {
      const result = getMutationError(error);

      setAction(
        (current) =>
          current && {
            ...current,
            requestError: result.message,
            conflict: result.conflict,
          }
      );
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {options.length > 0 ? (
        <div className={css.menuWrapper} ref={containerRef}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="pharmacy-moderation-menu"
            iconLeft={<ClipboardCheck size={17} aria-hidden="true" />}
            onClick={() =>
              setOpenMenuKey((current) =>
                current === menuKey ? null : menuKey
              )
            }
          >
            Manage pharmacy status <ChevronDown size={16} aria-hidden="true" />
          </Button>
          {menuOpen ? (
            <div
              className={css.menu}
              id="pharmacy-moderation-menu"
              role="menu"
              aria-label="Available pharmacy moderation actions"
            >
              {options.map((option) => (
                <button
                  key={option.action}
                  type="button"
                  role="menuitem"
                  className={
                    option.danger
                      ? css.dangerAction
                      : option.action === 'request_corrections'
                        ? css.correctionsAction
                        : css.approveAction
                  }
                  onClick={() => selectAction(option)}
                >
                  {option.danger ? (
                    <Ban size={17} aria-hidden="true" />
                  ) : option.action === 'request_corrections' ? (
                    <ClipboardEdit size={17} aria-hidden="true" />
                  ) : (
                    <CheckCircle2 size={17} aria-hidden="true" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {action ? (
        <ReasonModal
          isOpen
          eyebrow="Pharmacy moderation"
          title={action.option.label}
          description={
            <span className={css.modalDescription}>
              <span>
                <strong>{detail.current.name}</strong> (ID: {detail.id})
              </span>
              <span className={css.statusTransition}>
                <StatusBadge {...PHARMACY_STATUS_PRESENTATION[detail.status]} />
                <span aria-hidden="true">→</span>
                <StatusBadge
                  {...PHARMACY_STATUS_PRESENTATION[action.option.targetStatus]}
                />
                {action.option.action === 'request_corrections'
                  ? ' (status unchanged; a new review decision is audited)'
                  : null}
              </span>
              <span>{action.option.description}</span>
              {action.option.feedbackVisibleToOwner ? (
                <strong>
                  The owner will see this reason in the pharmacy profile.
                </strong>
              ) : null}
              <span className={css.requestId}>
                Request ID: {action.clientRequestId}
              </span>
            </span>
          }
          value={action.reason}
          fieldName="pharmacyModerationReason"
          fieldLabel={
            action.option.feedbackVisibleToOwner
              ? 'Reason (visible to owner)'
              : 'Reason for the audit log'
          }
          placeholder="Explain why this moderation decision is necessary..."
          confirmLabel={action.option.label}
          cancelLabel="Cancel"
          maxLength={PHARMACY_MODERATION_REASON_MAX_LENGTH}
          error={
            reasonError ||
            (action.conflict ? 'Refresh the pharmacy details to continue.' : '')
          }
          requestError={
            action.requestError ? (
              <span className={css.errorStack}>
                <span>{action.requestError}</span>
                {action.conflict ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    isLoading={isRefreshing}
                    onClick={() => void refreshConflict()}
                    iconLeft={<RefreshCw size={15} aria-hidden="true" />}
                  >
                    Refresh pharmacy details
                  </Button>
                ) : null}
              </span>
            ) : undefined
          }
          isLoading={isSubmitting || isRefreshing}
          tone={action.option.danger ? 'danger' : 'accent'}
          onValueChange={(reason) =>
            setAction(
              (current) =>
                current && {
                  ...current,
                  reason,
                  // A new payload must never be reused with the old idempotency key.
                  clientRequestId:
                    reason !== current.reason
                      ? crypto.randomUUID()
                      : current.clientRequestId,
                  requestError: current.conflict ? current.requestError : '',
                }
            )
          }
          onCancel={() => {
            if (!isSubmitting && !isRefreshing) setAction(null);
          }}
          onConfirm={() => void submitDecision()}
        />
      ) : null}
    </>
  );
}
