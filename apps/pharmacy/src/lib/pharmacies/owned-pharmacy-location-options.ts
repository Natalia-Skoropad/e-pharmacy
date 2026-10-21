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
  const byKey = new Map<string, string>();

  values.filter(Boolean).forEach((value) => {
    const key = value.toLocaleLowerCase();

    if (!byKey.has(key)) byKey.set(key, value);
  });

  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, 'uk', { sensitivity: 'base' })
  );
}

//===================================================================

export function getOwnedPharmacyLocationFilterOptions(
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
    rows.map((row) => normalize(row.location?.region)).concat(region)
  );

  return { settlements, regions };
}
