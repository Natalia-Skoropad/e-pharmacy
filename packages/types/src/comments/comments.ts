export type EntityComment = Readonly<{
  id: string;
  text: string;
  createdAt: string;
}>;

export type EntityCommentsPage = Readonly<{
  items: EntityComment[];
  page: number;
  total: number;
  totalPages: number;
}>;
