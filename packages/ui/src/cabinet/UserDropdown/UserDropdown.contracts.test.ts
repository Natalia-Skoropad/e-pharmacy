import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('user dropdown owns the shared disclosure, outside-click and Escape lifecycle', async () => {
  const source = await readFile(
    new URL('./UserDropdown.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /aria-controls=\{isOpen \? menuId : undefined\}/);
  assert.match(source, /useOutsidePointerDown/);
  assert.match(source, /event\.key !== 'Escape'/);
  assert.match(source, /triggerRef\.current\?\.focus\(\)/);
  assert.match(source, /type: 'link'/);
  assert.match(source, /type: 'action'/);
  assert.match(source, /type: 'status'/);
  assert.doesNotMatch(source, /logoutFromPharmacy|useAuth|PHARMACY_ROUTES/);
});
