/** Options come only from loaded table rows. Keep the current choice when a dependent filter changes. */
export type PharmacyLocationOption = Readonly<{
  settlement?: string;
  region?: string;
}>;

//===================================================================

type Row = Readonly<{ location?: PharmacyLocationOption }>;

//===================================================================

const normalize = (value?: string) => value?.trim() ?? '';

//===================================================================

function choices(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'uk', { sensitivity: 'base' })
  );
}

//===================================================================

export function getPharmacyLocationFilterOptions(
  rows: readonly Row[],
  settlement: string,
  region: string
) {
  const settlements = choices(
    rows
      .filter(
        (row) =>
          !region ||
          normalize(row.location?.region).toLocaleLowerCase() ===
            region.toLocaleLowerCase()
      )
      .map((row) => normalize(row.location?.settlement))
      .concat(settlement)
  );

  const regions = choices(
    rows
      .filter(
        (row) =>
          !settlement ||
          normalize(row.location?.settlement).toLocaleLowerCase() ===
            settlement.toLocaleLowerCase()
      )
      .map((row) => normalize(row.location?.region))
      .concat(region)
  );

  return { settlements, regions };
}
