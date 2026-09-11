import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('order counters refresh from explicit lifecycle signals instead of pathname changes', async () => {
  const source = await readFile(
    new URL('./PharmacySidebar.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /status:\s*'new'/);
  assert.match(source, /status:\s*'in_progress'/);
  assert.match(source, /subscribeToOrderCounterRefresh/);
  assert.match(source, /addEventListener\('focus'/);
  assert.match(source, /useEffect\([\s\S]*?\}, \[\]\);/);
  assert.equal(source.includes('}, [pathname]);'), false);
  assert.match(source, /@\/lib\/api\/browser\/orders\.api/);
});

//===================================================================

test('counter refresh aborts the previous generation before starting another', async () => {
  const source = await readFile(
    new URL('./PharmacySidebar.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /activeController\?\.abort\(\)/);
  assert.match(source, /currentVersion !== requestVersion/);
  assert.match(source, /controller\.signal\.aborted/);
});
