export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Cannot connect to the server. Please check that the API is running.';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
