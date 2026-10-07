export type PharmacyOwnerAdminCommentDto = Readonly<{
  id: string;
  ownerUserId: string;
  text: string;
  createdAt: string;

  author: Readonly<{
    userId: string;
    displayName: string;
  }>;
}>;
