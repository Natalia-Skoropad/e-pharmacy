export type PharmacyAdminCommentDto = Readonly<{
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
