export type ApiErrorResponse = {
  status: 'error';
  message: string;
  details?: Record<string, string[]>;
};
