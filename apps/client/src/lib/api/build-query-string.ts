type QueryValue = string | number | boolean | null | undefined;

//===================================================================

export function buildQueryString(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}
