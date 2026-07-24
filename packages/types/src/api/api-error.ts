export type ApiErrorResponse = Readonly<{
  status: 'error';
  message: string;
  details?: Readonly<Record<string, readonly string[]>>;
  code?: string;
  requestId?: string;
}>;
