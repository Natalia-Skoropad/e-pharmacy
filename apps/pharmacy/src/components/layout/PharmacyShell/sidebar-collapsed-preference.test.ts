import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getServerSidebarCollapsedSnapshot,
  getSidebarCollapsedSnapshot,
  subscribeToSidebarCollapsed,
  updateSidebarCollapsed,
} from './sidebar-collapsed-preference';

//===================================================================

type Listener = (event: Event) => void;

//===================================================================

function installWindow(options?: Readonly<{ storageThrows?: boolean }>) {
  const listeners = new Map<string, Set<Listener>>();
  const storage = new Map<string, string>();

  const fakeWindow = {
    localStorage: {
      getItem(key: string) {
        if (options?.storageThrows) throw new Error('storage unavailable');
        return storage.get(key) ?? null;
      },

      setItem(key: string, value: string) {
        if (options?.storageThrows) throw new Error('storage unavailable');
        storage.set(key, value);
      },
    },

    addEventListener(type: string, listener: Listener) {
      const bucket = listeners.get(type) ?? new Set<Listener>();
      bucket.add(listener);
      listeners.set(type, bucket);
    },

    removeEventListener(type: string, listener: Listener) {
      listeners.get(type)?.delete(listener);
    },

    dispatchEvent(event: Event) {
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event);
      }
      return true;
    },
  };

  Object.assign(globalThis, { window: fakeWindow });

  return {
    storage,

    emitStorage(key: string | null, newValue: string | null) {
      const event = new Event('storage') as StorageEvent;
      Object.defineProperties(event, {
        key: { value: key },
        newValue: { value: newValue },
      });
      fakeWindow.dispatchEvent(event);
    },

    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

//===================================================================

test('server snapshot is always expanded and valid stored booleans hydrate the client snapshot', () => {
  const fixture = installWindow();
  fixture.storage.set('pharmacy-sidebar-collapsed', 'true');

  assert.equal(getServerSidebarCollapsedSnapshot(), false);
  assert.equal(getSidebarCollapsedSnapshot(), true);

  fixture.storage.set('pharmacy-sidebar-collapsed', 'false');
  assert.equal(getSidebarCollapsedSnapshot(), false);
});

//===================================================================

test('same-tab updates persist when possible and notify active subscribers', () => {
  const fixture = installWindow();
  let calls = 0;

  const cleanup = subscribeToSidebarCollapsed(() => {
    calls += 1;
  });

  updateSidebarCollapsed(true);

  assert.equal(getSidebarCollapsedSnapshot(), true);
  assert.equal(fixture.storage.get('pharmacy-sidebar-collapsed'), 'true');
  assert.equal(calls, 1);

  cleanup();
  updateSidebarCollapsed(false);
  assert.equal(calls, 1);
});

//===================================================================

test('cross-tab storage events update the in-memory preference and ignore unrelated keys', () => {
  const fixture = installWindow();
  let calls = 0;

  const cleanup = subscribeToSidebarCollapsed(() => {
    calls += 1;
  });

  fixture.emitStorage('something-else', 'true');
  assert.equal(calls, 0);

  fixture.emitStorage('pharmacy-sidebar-collapsed', 'true');
  assert.equal(calls, 1);
  assert.equal(getSidebarCollapsedSnapshot(), true);

  fixture.emitStorage('pharmacy-sidebar-collapsed', 'false');
  assert.equal(calls, 2);
  assert.equal(getSidebarCollapsedSnapshot(), false);

  cleanup();
  assert.equal(fixture.listenerCount('storage'), 0);
  assert.equal(fixture.listenerCount('pharmacy:sidebar-collapsed-change'), 0);
});

//===================================================================

test('storage failures keep the in-memory preference functional', () => {
  installWindow({ storageThrows: true });

  updateSidebarCollapsed(true);
  assert.equal(getSidebarCollapsedSnapshot(), true);

  updateSidebarCollapsed(false);
  assert.equal(getSidebarCollapsedSnapshot(), false);
});
