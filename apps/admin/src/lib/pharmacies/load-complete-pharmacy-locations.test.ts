import assert from 'node:assert/strict';
import test from 'node:test';

//===================================================================

const { loadCompletePharmacyLocations } = (await import(
  new URL('./load-complete-pharmacy-locations.ts', import.meta.url).href
)) as typeof import('./load-complete-pharmacy-locations');

//===================================================================

test('location facet includes options across all pages, independently from table filters', async () => {
  const calls: number[] = [];

  const pages = [
    [{ location: { region: 'Odesa', settlement: 'Artsyz' } }],
    [{ location: { region: 'Kyiv', settlement: 'Kyiv' } }],
    [{ location: { region: 'Lviv', settlement: 'Lviv' } }],
  ];

  const result = await loadCompletePharmacyLocations(async (page) => {
    calls.push(page);

    return { items: pages[page - 1] ?? [], totalPages: pages.length };
  }, new AbortController().signal);

  assert.deepEqual(calls, [1, 2, 3]);

  assert.deepEqual(
    result.map(({ location }) => location?.region),
    ['Odesa', 'Kyiv', 'Lviv']
  );
});

//===================================================================

test('facet loader respects cancellation and cannot append stale options', async () => {
  const controller = new AbortController();

  await assert.rejects(
    () =>
      loadCompletePharmacyLocations(async () => {
        controller.abort();
        return { items: [{ location: { region: 'Odesa' } }], totalPages: 2 };
      }, controller.signal),
    /cancelled/
  );
});
