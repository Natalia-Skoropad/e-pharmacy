'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Ban,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';
import { useToast } from '@e-pharmacy/ui/feedback';
import { ReasonModal } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  deactivateOwnedPharmacy,
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

import { FIELD_LABELS } from '../OwnedPharmacyEditor/pharmacy-editor-presentation';
import { getPharmacyModerationSummary } from './pharmacy-moderation-summary';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

type Action = 'verification' | 'moderation' | 'deactivate';

//===================================================================

// Keep these icons consistent with the corresponding pharmacy detail tabs.
const MODERATION_TAB_ICONS: Record<string, LucideIcon> = {
  'Pharmacy data': ClipboardList,
  'About pharmacy': FileText,
  'Payment details': CreditCard,
  Documents: FileText,
};

//===================================================================

export function OwnedPharmacyActions({
  pharmacy,
  onRefresh,
}: Readonly<{ pharmacy: MyPharmacyProfile; onRefresh: () => void }>) {
  const toast = useToast();
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
    pharmacy.status === 'active' || pharmacy.status === 'on_moderation';

  const pending = pharmacy.pendingModeration;
  const hasChanges = Boolean(pending && Object.keys(pending).length);
  const moderationSummary = getPharmacyModerationSummary(pharmacy);

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
    if (pharmacy.membershipRole !== 'owner' || !needsVerification) return;

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
  }, [needsVerification, pharmacy.membershipRole]);

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

  const open = (next: Action) => {
    setAction(next);
    setMenuOpen(false);
    setComment('');
    setRequestError('');
  };

  const submit = async () => {
    if (!action || busy || !comment.trim()) return;

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
              {needsVerification ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.approveAction}
                  disabled={verificationIncomplete || !ownerHasDocuments}
                  title={
                    verificationIncomplete || !ownerHasDocuments
                      ? 'Complete required fields and attach pharmacy and owner documents first.'
                      : undefined
                  }
                  onClick={() => open('verification')}
                >
                  <ClipboardCheck size={17} aria-hidden="true" />
                  Send for verification
                </button>
              ) : null}
              {needsModeration ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.approveAction}
                  disabled={!hasChanges || moderationIncomplete}
                  title={
                    !hasChanges
                      ? 'Save at least one change before sending for moderation.'
                      : moderationIncomplete
                        ? `Complete the required fields: ${[
                            ...missingModerationFields.map(
                              (field) => FIELD_LABELS[field]
                            ),

                            ...(!documentsCount ? ['Pharmacy documents'] : []),

                            ...(!pharmacy.location?.countryCode
                              ? ['Country']
                              : []),
                          ].join(', ')}.`
                        : undefined
                  }
                  onClick={() => open('moderation')}
                >
                  <ShieldCheck size={17} aria-hidden="true" />
                  Send for moderation
                </button>
              ) : null}
              {canDeactivate ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.dangerAction}
                  disabled={!eligibility?.canDeactivate}
                  title={
                    eligibility?.reason ??
                    'Checking unfinished orders and product requests'
                  }
                  onClick={() => open('deactivate')}
                >
                  <Ban size={17} aria-hidden="true" />
                  Deactivate pharmacy
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {action ? (
        <ReasonModal
          eyebrow="PHARMACY STATUS"
          title={
            action === 'deactivate'
              ? 'Deactivate pharmacy?'
              : action === 'verification'
                ? 'Send pharmacy for verification?'
                : 'Send changes for moderation?'
          }
          description={
            action === 'deactivate'
              ? 'The pharmacy will become unavailable. All unfinished orders and product requests must be closed first; this action and its reason are recorded in Activity history.'
              : 'Provide a short description for the administrator. Saved and submitted values will remain separate until a decision is made.'
          }
          details={
            action === 'moderation' ? (
              <section
                className={css.moderationSummary}
                aria-label="Changes for moderation"
              >
                <strong>Changes you are about to send</strong>
                <ul>
                  {moderationSummary.map((group) => {
                    const Icon = MODERATION_TAB_ICONS[group.title] ?? FileText;

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
            ) : undefined
          }
          value={comment}
          fieldName="pharmacyOwnerActionDescription"
          fieldLabel="Short description for the administrator"
          placeholder="Briefly describe the reason or submitted changes..."
          confirmLabel={
            action === 'deactivate'
              ? 'Deactivate pharmacy'
              : action === 'verification'
                ? 'Send for verification'
                : 'Send for moderation'
          }
          cancelLabel="Cancel"
          maxLength={500}
          error={comment.trim() ? '' : 'Short description is required.'}
          requestError={requestError}
          tone={action === 'deactivate' ? 'danger' : 'accent'}
          isLoading={busy}
          onValueChange={setComment}
          onCancel={() => setAction(null)}
          onConfirm={() => void submit()}
        />
      ) : null}
    </>
  );
}
