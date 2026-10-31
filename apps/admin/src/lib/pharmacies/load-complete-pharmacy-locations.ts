/** Load all location facets independently of the visible filtered/paginated table.
 * Pagination stays server-side; the selector must not shrink when filters change.
 * A dedicated backend `locations` endpoint can replace this loader as the dataset grows. */
export type PharmacyLocationRow = Readonly<{
  location?: Readonly<{ region?: string; settlement?: string }>;
}>;

//===================================================================

export async function loadCompletePharmacyLocations<
  T extends PharmacyLocationRow,
>(
  getPage: (page: number) => Promise<
    Readonly<{
      items: readonly T[];
      totalPages: number;
    }>
  >,

  signal: AbortSignal
): Promise<readonly PharmacyLocationRow[]> {
  // Start the first page to learn the total; load remaining pages in bounded
  // parallel batches so filter choices do not trickle in several seconds late.
  const first = await getPage(1);

  if (signal.aborted) throw new Error('Location options request cancelled.');

  const locations: PharmacyLocationRow[] = first.items.map(({ location }) => ({
    location,
  }));

  const totalPages = Math.max(1, first.totalPages);

  for (let start = 2; start <= totalPages; start += 6) {
    const pages = Array.from(
      { length: Math.min(6, totalPages - start + 1) },
      (_, index) => start + index
    );

    const batch = await Promise.all(pages.map(getPage));

    if (signal.aborted) throw new Error('Location options request cancelled.');

    for (const response of batch) {
      locations.push(...response.items.map(({ location }) => ({ location })));
    }
  }

  return locations;
}
