import assert from 'node:assert/strict';
import test from 'node:test';

//===================================================================

import {
  getBoundedIndex,
  getNextLoopedIndex,
  isListboxOpenKey,
  isListboxSelectKey,
} from './listbox-keyboard.ts';

//===================================================================

test('recognizes listbox keyboard actions', () => {
  assert.equal(isListboxOpenKey('ArrowDown'), true);
  assert.equal(isListboxOpenKey('ArrowUp'), true);
  assert.equal(isListboxOpenKey('Enter'), false);
  assert.equal(isListboxSelectKey('Enter'), true);
  assert.equal(isListboxSelectKey(' '), true);
  assert.equal(isListboxSelectKey('Escape'), false);
});

//===================================================================

test('keeps active indexes inside available options', () => {
  assert.equal(
    getNextLoopedIndex({ currentIndex: 2, direction: 1, itemsCount: 3 }),
    0
  );

  assert.equal(
    getNextLoopedIndex({ currentIndex: 0, direction: -1, itemsCount: 3 }),
    2
  );

  assert.equal(getBoundedIndex(-10, 4), 0);
  assert.equal(getBoundedIndex(10, 4), 3);
});
