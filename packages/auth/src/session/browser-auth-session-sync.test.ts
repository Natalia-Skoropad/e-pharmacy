import assert from 'node:assert/strict';
import test from 'node:test';

import { createBrowserAuthSessionSync } from './browser-auth-session-sync';

//===================================================================

type MessageListener = (event: MessageEvent<unknown>) => void;

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];

  readonly messages: unknown[] = [];
  private readonly listeners = new Set<MessageListener>();
  closed = false;

  readonly name: string;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  addEventListener(_type: 'message', listener: MessageListener): void {
    this.listeners.add(listener);
  }

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  emit(message: unknown): void {
    this.listeners.forEach((listener) =>
      listener({ data: message } as MessageEvent<unknown>)
    );
  }

  close(): void {
    this.closed = true;
    this.listeners.clear();
  }
}

//===================================================================

test('publishes only non-sensitive auth lifecycle events', () => {
  const originalWindow = globalThis.window;
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    configurable: true,
    value: MockBroadcastChannel,
  });

  try {
    const sync = createBrowserAuthSessionSync();
    const channel = MockBroadcastChannel.instances.at(-1);
    assert.ok(channel);

    sync.publish('authenticated');
    sync.publish('unauthenticated');
    sync.publish('revalidate');

    assert.deepEqual(channel.messages, [
      'authenticated',
      'unauthenticated',
      'revalidate',
    ]);

    sync.close();
    assert.equal(channel.closed, true);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: originalBroadcastChannel,
    });
  }
});

//===================================================================

test('ignores invalid messages and supports unsubscribe', () => {
  const originalWindow = globalThis.window;
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    configurable: true,
    value: MockBroadcastChannel,
  });

  try {
    const sync = createBrowserAuthSessionSync();
    const channel = MockBroadcastChannel.instances.at(-1);
    assert.ok(channel);

    const received: string[] = [];
    const unsubscribe = sync.subscribe((event) => received.push(event));

    channel.emit({ user: { email: 'private@example.com' } });
    channel.emit('unknown');
    channel.emit('revalidate');
    unsubscribe();
    channel.emit('unauthenticated');

    assert.deepEqual(received, ['revalidate']);
    sync.close();
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: originalBroadcastChannel,
    });
  }
});

//===================================================================

test('falls back to a no-op adapter without browser channel support', () => {
  const originalWindow = globalThis.window;
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    configurable: true,
    value: undefined,
  });

  try {
    const sync = createBrowserAuthSessionSync();
    const unsubscribe = sync.subscribe(() => {
      throw new Error('The no-op adapter must not invoke listeners.');
    });

    sync.publish('authenticated');
    unsubscribe();
    sync.close();
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: originalBroadcastChannel,
    });
  }
});
