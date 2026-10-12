/** Stage 14.6: admin-only, never surfaced from owner/pharmacy API. */
export type AdminPharmacyDocument = Readonly<{
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  source: 'published' | 'pending';
}>;

//===================================================================

export type AdminPharmacyDocumentsResponse = Readonly<{
  documents: AdminPharmacyDocument[];
}>;

//===================================================================

export type AdminPharmacyComment = Readonly<{
  id: string;
  pharmacyId: string;
  text: string;
  createdAt: string;

  author: Readonly<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
  }>;
}>;

//===================================================================

export type AdminPharmacyCommentsResponse = Readonly<{
  comments: AdminPharmacyComment[];
}>;

export type AdminPharmacyCommentResponse = Readonly<{
  comment: AdminPharmacyComment;
}>;

export type CreateAdminPharmacyCommentPayload = Readonly<{
  text: string;
  clientRequestId: string;
}>;
