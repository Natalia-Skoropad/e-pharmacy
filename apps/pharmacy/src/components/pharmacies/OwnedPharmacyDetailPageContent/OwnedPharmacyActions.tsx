'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  Ban,
  XCircle,
  Trash2,
  X,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  ShieldCheck,
  RotateCcw,
  ClipboardCheck as SectionActionIcon,
  type LucideIcon,
} from 'lucide-react';

import type {
  MyPharmacyProfile,
  PharmacyStatus,
} from '@e-pharmacy/types/pharmacies';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { useToast } from '@e-pharmacy/ui/feedback';

import {
  ReasonModal,
  ConfirmationModal,
  InfoTooltip,
} from '@e-pharmacy/ui/overlays';

import { Button } from '@e-pharmacy/ui/primitives';

import {
  cancelOwnedPharmacyReview,
  deactivateOwnedPharmacy,
  requestOwnedPharmacyReactivation,
  deleteOwnedPharmacyDraft,
  getOwnedPharmacyDeactivationEligibility,
  sendOwnedPharmacyForVerification,
  submitOwnedPharmacyModeration,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { getMyPharmacyOwnerDocuments } from '@/lib/api/browser';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';
import { dispatchPharmacyCounterRefresh } from '@/lib/pharmacies/pharmacy-counter-refresh';

import {
  validatePharmacyEditor,
  effectivePharmacyEditorValues,
} from '../OwnedPharmacyEditor/pharmacy-editor-fields';

import { getPharmacyModerationSummary } from './pharmacy-moderation-summary';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

type Action = 'verification' | 'moderation' | 'deactivate' | 'reactivate';

//===================================================================

// Keep these icons consistent with the corresponding pharmacy detail tabs.
const MODERATION_TAB_ICONS: Record<string, LucideIcon> = {
  'Pharmacy data': ClipboardList,
  'About pharmacy': FileText,
  'Payment details': CreditCard,
  Documents: FileText,
};

//===================================================================

function ActionMenuItem({
  className,
  disabled = false,
  disabledReason,
  onClick,
  children,
}: Readonly<{
  className: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
  children: ReactNode;
}>) {
  return (
    <div className={css.statusActionRow}>
      <button
        type="button"
        role="menuitem"
        className={className}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>

      {disabled && disabledReason ? (
        <span className={css.statusActionTooltip}>
          <InfoTooltip
            label="Why this action is unavailable"
            title="Action unavailable"
            icon={<SectionActionIcon size={20} aria-hidden="true" />}
            escapeOverflow
          >
            <span>{disabledReason}</span>
          </InfoTooltip>
        </span>
      ) : null}
    </div>
  );
}

//===================================================================

export function OwnedPharmacyActions({
  pharmacy,
  onRefresh,
}: Readonly<{ pharmacy: MyPharmacyProfile; onRefresh: () => void }>) {
  const toast = useToast();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [cancelReview, setCancelReview] = useState<
    'verification' | 'moderation' | 'reactivation' | null
  >(null);

  const [action, setAction] = useState<Action | null>(null);
  const [comment, setComment] = useState('');
  const [requestError, setRequestError] = useState('');
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerHasDocuments, setOwnerHasDocuments] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  const [eligibility, setEligibility] = useState<{
    canDeactivate: boolean;
    reason: string;
    activeOrders: number;
    activeProductRequests: number;
  } | null>(null);

  const needsVerification =
    pharmacy.status === 'new' ||
    (pharmacy.status === 'on_verification' &&
      pharmacy.reviewState === 'changes_requested');

  const needsModeration =
    pharmacy.status === 'active' ||
    (pharmacy.status === 'on_moderation' &&
      pharmacy.reviewState === 'changes_requested');

  const canDeactivate =
    pharmacy.status === 'active' ||
    (pharmacy.status === 'on_moderation' &&
      pharmacy.reviewState === 'changes_requested');

  const canRequestReactivation =
    (pharmacy.status === 'blocked' && pharmacy.reviewState !== 'pending') ||
    (pharmacy.status === 'on_reactivation' &&
      pharmacy.reviewState === 'changes_requested');

  const canCancelReview =
    pharmacy.reviewState === 'changes_requested' &&
    (pharmacy.status === 'on_verification' ||
      pharmacy.status === 'on_moderation' ||
      pharmacy.status === 'on_reactivation');

  const pending = pharmacy.pendingModeration;
  const moderationSummary = getPharmacyModerationSummary(pharmacy);
  const hasChanges = moderationSummary.length > 0;

  const documentsCount =
    pending?.documents?.length ?? pharmacy.documents.length;

  const effective = effectivePharmacyEditorValues(pharmacy);

  // Moderation of an already active pharmacy must not reject an otherwise
  // complete record because of legacy formatting in an unchanged field.
  // This matches the backend's required-field check for the *effective*
  // published + pending record, rather than re-verifying every old value.
  const moderationRequired = [
    'name',
    'address',
    'settlement',
    'region',
    'phone',
    'email',
    'workingHours',
    'imageUrl',
    'description',
    'shortDescription',
    'recipientName',
    'taxId',
    'iban',
    'bankName',
    'receiptEmail',
    'paymentPurpose',
  ] as const;

  const missingModerationFields = moderationRequired.filter(
    (field) => !effective[field].trim()
  );

  const moderationIncomplete =
    missingModerationFields.length > 0 ||
    !documentsCount ||
    !pharmacy.location?.countryCode;

  // Initial verification remains stricter than moderation of approved data.
  const verificationIncomplete =
    Object.keys(
      validatePharmacyEditor(effective, documentsCount, 'verification')
    ).length > 0;

  useEffect(() => {
    if (
      pharmacy.membershipRole !== 'owner' ||
      (!needsVerification && !canRequestReactivation)
    )
      return;

    let active = true;

    void getMyPharmacyOwnerDocuments()
      .then((value) => {
        if (active) setOwnerHasDocuments(value.documents.length > 0);
      })

      .catch(() => {
        if (active) setOwnerHasDocuments(false);
      });

    return () => {
      active = false;
    };
  }, [needsVerification, canRequestReactivation, pharmacy.membershipRole]);

  useEffect(() => {
    if (pharmacy.membershipRole !== 'owner' || !canDeactivate) return;

    const controller = new AbortController();

    void getOwnedPharmacyDeactivationEligibility(pharmacy.id, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setEligibility(value);
      })

      .catch(() => {
        if (!controller.signal.aborted) {
          setEligibility({
            canDeactivate: false,

            reason:
              'Could not verify whether orders and product requests are finished. Try refreshing the page.',

            activeOrders: 0,
            activeProductRequests: 0,
          });
        }
      });

    return () => controller.abort();
  }, [pharmacy.id, pharmacy.updatedAt, pharmacy.membershipRole, canDeactivate]);

  useEffect(() => {
    if (!menuOpen) return;

    const close = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };

    document.addEventListener('pointerdown', close);

    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const removeDraft = async () => {
    if (busy || pharmacy.status !== 'new') return;

    setBusy(true);

    try {
      await deleteOwnedPharmacyDraft(pharmacy.id, pharmacy.updatedAt);

      setDeleteOpen(false);
      dispatchPharmacyCounterRefresh();
      toast.success('Pharmacy draft permanently deleted.');
      router.replace('/pharmacy/pharmacies');
    } catch (error) {
      setDeleteOpen(false);

      toast.error(
        getProfileErrorMessage(error, 'Could not delete this pharmacy draft.')
      );
    } finally {
      setBusy(false);
    }
  };

  const open = (next: Action) => {
    setAction(next);
    setMenuOpen(false);
    setComment('');
    setRequestError('');
  };

  const submit = async () => {
    if (
      !action ||
      busy ||
      !comment.trim() ||
      (action === 'moderation' && (!hasChanges || moderationIncomplete)) ||
      (action === 'verification' &&
        (verificationIncomplete || !ownerHasDocuments)) ||
      (action === 'deactivate' && !eligibility?.canDeactivate) ||
      (action === 'reactivate' &&
        (!canRequestReactivation || moderationIncomplete))
    )
      return;

    setBusy(true);
    setRequestError('');

    try {
      if (action === 'verification') {
        await sendOwnedPharmacyForVerification(pharmacy.id, comment.trim());

        toast.success('Pharmacy sent for verification.');
      } else if (action === 'moderation') {
        await submitOwnedPharmacyModeration(pharmacy.id, {
          changes: {},
          expectedRevision: pharmacy.updatedAt,
          comment: comment.trim(),
        });

        toast.success('Pharmacy changes sent for moderation.');
      } else if (action === 'reactivate') {
        await requestOwnedPharmacyReactivation(pharmacy.id, {
          expectedRevision: pharmacy.updatedAt,
          reason: comment.trim(),
        });

        toast.success('Reactivation request sent.');
      } else {
        await deactivateOwnedPharmacy(pharmacy.id, {
          expectedRevision: pharmacy.updatedAt,
          reason: comment.trim(),
        });

        toast.success('Pharmacy deactivated.');
      }

      setAction(null);
      dispatchPharmacyCounterRefresh();
      onRefresh();
    } catch (error) {
      setRequestError(
        getProfileErrorMessage(
          error,
          'Action could not be completed. Refresh pharmacy details and retry.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmCancellation = async () => {
    if (!cancelReview || busy) return;

    setBusy(true);

    try {
      await cancelOwnedPharmacyReview(
        pharmacy.id,
        cancelReview,
        pharmacy.updatedAt
      );

      toast.success(
        `${cancelReview[0].toUpperCase()}${cancelReview.slice(1)} cancelled.`
      );

      setCancelReview(null);
      dispatchPharmacyCounterRefresh();
      onRefresh();
    } catch (error) {
      toast.error(
        getProfileErrorMessage(
          error,
          'Could not cancel review. Refresh and retry.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  if (pharmacy.membershipRole !== 'owner') return null;

  return (
    <>
      <div className={css.actions}>
        <div className={css.statusMenu} ref={menu}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="owner-pharmacy-status-menu"
            iconLeft={<ClipboardCheck size={17} aria-hidden="true" />}
            onClick={() => setMenuOpen((previous) => !previous)}
          >
            Manage pharmacy status <ChevronDown size={16} aria-hidden="true" />
          </Button>
          {menuOpen ? (
            <div
              id="owner-pharmacy-status-menu"
              className={css.statusMenuOptions}
              role="menu"
              aria-label="Available pharmacy actions"
            >
              {pharmacy.status === 'new' ||
              pharmacy.status === 'on_verification' ? (
                <>
                  <ActionMenuItem
                    className={css.verificationAction}
                    disabled={
                      !needsVerification ||
                      verificationIncomplete ||
                      !ownerHasDocuments
                    }
                    disabledReason={
                      !needsVerification
                        ? 'This pharmacy is already being reviewed. You can submit it again after the administrator requests changes.'
                        : verificationIncomplete || !ownerHasDocuments
                          ? 'Complete the required pharmacy fields and attach both pharmacy and owner documents before you submit for verification.'
                          : undefined
                    }
                    onClick={() => open('verification')}
                  >
                    <ClipboardCheck size={17} aria-hidden="true" />
                    {pharmacy.status === 'on_verification'
                      ? 'Resend for verification'
                      : 'Send for verification'}
                  </ActionMenuItem>
                  {pharmacy.status === 'on_verification' ? (
                    <ActionMenuItem
                      className={css.dangerAction}
                      disabled={!canCancelReview}
                      disabledReason={
                        !canCancelReview
                          ? 'You can cancel this request only after the administrator asks for changes.'
                          : undefined
                      }
                      onClick={() => {
                        setMenuOpen(false);
                        setCancelReview('verification');
                      }}
                    >
                      <XCircle size={17} aria-hidden="true" /> Cancel
                      verification request
                    </ActionMenuItem>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className={css.dangerAction}
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 size={17} aria-hidden="true" /> Delete pharmacy
                      draft
                    </button>
                  )}
                </>
              ) : null}
              {pharmacy.status === 'active' ||
              pharmacy.status === 'on_moderation' ? (
                <>
                  <ActionMenuItem
                    className={css.approveAction}
                    disabled={
                      !needsModeration || !hasChanges || moderationIncomplete
                    }
                    disabledReason={
                      !needsModeration
                        ? 'This pharmacy update is already being reviewed. You can submit it again after the administrator requests changes.'
                        : !hasChanges
                          ? 'Save at least one proposed pharmacy change before you submit for moderation.'
                          : moderationIncomplete
                            ? 'Complete the required pharmacy details and attach the required documents before you submit for moderation.'
                            : undefined
                    }
                    onClick={() => open('moderation')}
                  >
                    <ShieldCheck size={17} aria-hidden="true" />
                    {pharmacy.status === 'on_moderation'
                      ? 'Resend for moderation'
                      : 'Send for moderation'}
                  </ActionMenuItem>
                  {pharmacy.status === 'on_moderation' ? (
                    <ActionMenuItem
                      className={css.dangerAction}
                      disabled={!canCancelReview}
                      disabledReason={
                        !canCancelReview
                          ? 'You can cancel this request only after the administrator asks for changes.'
                          : undefined
                      }
                      onClick={() => {
                        setMenuOpen(false);
                        setCancelReview('moderation');
                      }}
                    >
                      <XCircle size={17} aria-hidden="true" /> Cancel moderation
                      request
                    </ActionMenuItem>
                  ) : (
                    <ActionMenuItem
                      className={css.dangerAction}
                      disabled={!eligibility?.canDeactivate}
                      disabledReason={
                        eligibility?.reason ??
                        'Check unfinished orders and requests before you deactivate this pharmacy.'
                      }
                      onClick={() => open('deactivate')}
                    >
                      <Ban size={17} aria-hidden="true" /> Deactivate pharmacy
                    </ActionMenuItem>
                  )}
                </>
              ) : null}
              {pharmacy.status === 'blocked' ||
              pharmacy.status === 'on_reactivation' ? (
                <>
                  <ActionMenuItem
                    className={css.approveAction}
                    disabled={
                      !canRequestReactivation ||
                      moderationIncomplete ||
                      !ownerHasDocuments
                    }
                    disabledReason={
                      !canRequestReactivation
                        ? 'This pharmacy is already being reviewed for reactivation. You can submit it again after the administrator requests changes.'
                        : moderationIncomplete || !ownerHasDocuments
                          ? 'Complete the required pharmacy details and attach both pharmacy and owner documents before you request reactivation.'
                          : undefined
                    }
                    onClick={() => open('reactivate')}
                  >
                    <RotateCcw size={17} aria-hidden="true" />
                    {pharmacy.status === 'on_reactivation'
                      ? 'Resend reactivation request'
                      : 'Request reactivation'}
                  </ActionMenuItem>
                  {pharmacy.status === 'on_reactivation' ? (
                    <ActionMenuItem
                      className={css.dangerAction}
                      disabled={!canCancelReview}
                      disabledReason={
                        !canCancelReview
                          ? 'You can cancel this request only after the administrator asks for changes.'
                          : undefined
                      }
                      onClick={() => {
                        setMenuOpen(false);
                        setCancelReview('reactivation');
                      }}
                    >
                      <XCircle size={17} aria-hidden="true" /> Cancel
                      reactivation request
                    </ActionMenuItem>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmationModal
        isOpen={cancelReview !== null}
        eyebrow="PHARMACY REVIEW"
        title={`Cancel ${cancelReview ?? 'review'}?`}
        description={
          cancelReview === 'moderation'
            ? 'All proposed changes, including proposed pharmacy documents, will be permanently discarded. Your pharmacy will return to Active with its previously approved data. This cannot be undone.'
            : cancelReview === 'verification'
              ? 'The verification review will end and your pharmacy will return to New. Saved information and pharmacy documents will be preserved.'
              : 'Your reactivation request will close and the pharmacy will return to Inactive. Saved proposed changes will be preserved.'
        }
        confirmLabel={`Cancel ${cancelReview ?? 'review'}`}
        cancelLabel="Keep request"
        destructive={cancelReview === 'moderation'}
        isLoading={busy}
        onConfirm={() => void confirmCancellation()}
        onCancel={() => {
          if (!busy) setCancelReview(null);
        }}
      />

      <ConfirmationModal
        isOpen={deleteOpen}
        eyebrow="PHARMACY STATUS"
        title="Permanently delete pharmacy draft?"
        description="This New pharmacy and its attached pharmacy documents will be deleted. This cannot be undone. Owner documents remain intact."
        confirmLabel="Delete draft"
        cancelLabel="Keep draft"
        cancelIconLeft={<X size={17} />}
        destructive
        confirmIconLeft={<Trash2 size={17} />}
        isLoading={busy}
        onConfirm={() => void removeDraft()}
        onCancel={() => {
          if (!busy) setDeleteOpen(false);
        }}
      />

      {action ? (
        <ReasonModal
          eyebrow="PHARMACY STATUS"
          title={
            action === 'deactivate'
              ? 'Deactivate pharmacy?'
              : action === 'reactivate'
                ? 'Request pharmacy reactivation?'
                : action === 'verification'
                  ? 'Send pharmacy for verification?'
                  : 'Send changes for moderation?'
          }
          description={
            action === 'deactivate'
              ? 'The pharmacy will become unavailable. All unfinished orders and product requests must be closed first; this action and its reason are recorded in Activity history.'
              : action === 'reactivate'
                ? 'Your pharmacy will remain unavailable while the administrator reviews this frozen version. You cannot edit or cancel the request until the administrator responds.'
                : 'The administrator will review the submitted version. You cannot edit your pharmacy or cancel the request while the review is pending. This may take several days.'
          }
          details={
            <div className={css.reviewJourney}>
              <div className={css.reviewJourneyTransition}>
                <StatusBadge
                  {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]}
                />
                <span aria-hidden="true">→</span>

                <StatusBadge
                  {...PHARMACY_STATUS_PRESENTATION[
                    (action === 'verification'
                      ? 'on_verification'
                      : action === 'moderation'
                        ? 'on_moderation'
                        : action === 'reactivate'
                          ? 'on_reactivation'
                          : 'blocked') as PharmacyStatus
                  ]}
                />
              </div>
              {action === 'verification' ? (
                <div className={css.reviewJourneyOutcomes}>
                  <strong>What happens next?</strong>
                  <span>Possible decisions:</span>

                  <div className={css.reviewJourneyTransition}>
                    <StatusBadge {...PHARMACY_STATUS_PRESENTATION.active} />
                    <span>Approved</span>
                  </div>

                  <div className={css.reviewJourneyTransition}>
                    <StatusBadge
                      {...PHARMACY_STATUS_PRESENTATION.on_verification}
                    />
                    <span>
                      Needs changes — editing reopens after the administrator
                      requests corrections
                    </span>
                  </div>

                  <div className={css.reviewJourneyTransition}>
                    <StatusBadge {...PHARMACY_STATUS_PRESENTATION.blocked} />
                    <span>Blocked — if a serious violation is identified</span>
                  </div>
                </div>
              ) : null}
              {action === 'moderation' ? (
                <section
                  className={css.moderationSummary}
                  aria-label="Changes for moderation"
                >
                  <strong>Changes you are about to send</strong>
                  <ul>
                    {moderationSummary.map((group) => {
                      const Icon =
                        MODERATION_TAB_ICONS[group.title] ?? FileText;

                      return (
                        <li key={group.title}>
                          <span
                            className={css.moderationTabIcon}
                            aria-hidden="true"
                          >
                            <Icon size={18} />
                          </span>

                          <div className={css.moderationTabDescription}>
                            <strong>{group.title}</strong>{' '}
                            <span>({group.fields.join(', ')})</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </div>
          }
          value={comment}
          fieldName="pharmacyOwnerActionDescription"
          fieldLabel="Short description for the administrator"
          placeholder="Briefly describe the reason or submitted changes..."
          confirmLabel={
            action === 'deactivate'
              ? 'Deactivate pharmacy'
              : action === 'reactivate'
                ? 'Request reactivation'
                : action === 'verification'
                  ? 'Send for verification'
                  : 'Send for moderation'
          }
          cancelLabel="Cancel"
          maxLength={500}
          error={comment.trim() ? '' : 'Short description is required.'}
          requestError={requestError}
          tone={
            action === 'deactivate'
              ? 'danger'
              : action === 'verification'
                ? 'verification'
                : 'accent'
          }
          isLoading={busy}
          onValueChange={setComment}
          onCancel={() => setAction(null)}
          onConfirm={() => void submit()}
        />
      ) : null}
    </>
  );
}
