export type InfoRevisionDate = Readonly<{
  iso: string;
  label: string;
}>;

//===================================================================

export type InfoDocumentApprovalStatus =
  | 'unreviewed'
  | 'in_review'
  | 'approved';

//===================================================================

export type InfoDocumentMetadata = Readonly<{
  version: string;
  effectiveAt: InfoRevisionDate | null;
  updatedAt: InfoRevisionDate;
  contentOwner: string | null;
  approvalStatus: InfoDocumentApprovalStatus;
  legalEntity: string | null;
  supportRoute: string | null;
  reviewId: string | null;
}>;

//===================================================================

export type InfoPageSection = Readonly<{
  id: string;
  title: string;
  content: readonly string[];
}>;

//===================================================================

export type InfoPageHighlight = Readonly<{
  id: string;
  title: string;
  text: string;
}>;

//===================================================================

export type InfoPageData = Readonly<{
  path: string;
  title: string;
  description: string;
  metadata: InfoDocumentMetadata;
  highlights?: readonly InfoPageHighlight[];
  sections: readonly InfoPageSection[];
}>;

//===================================================================

export function isInfoDocumentApproved(
  document: Pick<InfoPageData, 'metadata'>
): boolean {
  const { metadata } = document;

  return Boolean(
    metadata.approvalStatus === 'approved' &&
      metadata.version.trim() &&
      metadata.effectiveAt?.iso &&
      metadata.effectiveAt.label.trim() &&
      metadata.updatedAt.iso &&
      metadata.updatedAt.label.trim() &&
      metadata.contentOwner?.trim() &&
      metadata.legalEntity?.trim() &&
      metadata.reviewId?.trim()
  );
}

//===================================================================

export function isInfoDocumentNoIndex(
  document: Pick<InfoPageData, 'metadata'>
): boolean {
  return !isInfoDocumentApproved(document);
}
