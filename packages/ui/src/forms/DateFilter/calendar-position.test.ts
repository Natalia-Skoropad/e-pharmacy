import assert from 'node:assert/strict';
import test from 'node:test';

import { placeCalendarPopover } from './calendar-position';

//===================================================================

test('keeps the calendar inside the drawer-side viewport edge', () => {
  const position = placeCalendarPopover(
    { left: 1120, top: 120, bottom: 168 },
    { width: 320, height: 360 },
    { width: 1280, height: 800 }
  );

  assert.deepEqual(position, { top: 176, left: 948 });
});

//===================================================================

test('opens above the input when its lower edge would be clipped', () => {
  const position = placeCalendarPopover(
    { left: 24, top: 490, bottom: 538 },
    { width: 320, height: 360 },
    { width: 400, height: 600 }
  );

  assert.deepEqual(position, { top: 122, left: 24 });
});

//===================================================================

test('clamps a long calendar within short mobile viewports', () => {
  const position = placeCalendarPopover(
    { left: 30, top: 140, bottom: 188 },
    { width: 296, height: 500 },
    { width: 320, height: 420 }
  );

  assert.deepEqual(position, { top: 12, left: 12 });
});
