import assert from 'node:assert/strict';
import test from 'node:test';

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type {
  PharmacyNote,
  PharmacyNotesResponse,
} from '@e-pharmacy/types/notes';

import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import { useEntityCommentsResource } from './useEntityCommentsResource';

//===================================================================

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

class FakeHtmlElement {}
class FakeHtmlIFrameElement extends FakeHtmlElement {}

//===================================================================

type FakeDocument = Readonly<{
  nodeType: 9;
  documentElement: FakeElement;
  body: FakeElement;
  activeElement: null;
  defaultView: FakeWindow;
  addEventListener: () => void;
  removeEventListener: () => void;
  createElement: (tagName: string) => FakeElement;
}>;

type FakeWindow = Readonly<{
  document: FakeDocument;
  HTMLElement: typeof FakeHtmlElement;
  HTMLIFrameElement: typeof FakeHtmlIFrameElement;
  getSelection: () => null;
}>;

//===================================================================

class FakeElement {
  readonly nodeType = 1;
  readonly ownerDocument: FakeDocument;
  parentNode: FakeElement | null = null;
  readonly childNodes: FakeElement[] = [];
  tagName = 'DIV';
  nodeName = 'DIV';
  namespaceURI = 'http://www.w3.org/1999/xhtml';
  readonly style: Record<string, string> = {};
  textContent = '';

  constructor(ownerDocument: FakeDocument) {
    this.ownerDocument = ownerDocument;
  }

  addEventListener(): void {
    return;
  }

  removeEventListener(): void {
    return;
  }

  setAttribute(): void {
    return;
  }

  removeAttribute(): void {
    return;
  }

  appendChild(node: FakeElement): FakeElement {
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  insertBefore(node: FakeElement, before: FakeElement): FakeElement {
    node.parentNode = this;
    const index = this.childNodes.indexOf(before);
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    return node;
  }

  removeChild(node: FakeElement): FakeElement {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) this.childNodes.splice(index, 1);
    node.parentNode = null;
    return node;
  }
}

//===================================================================

function installMinimalDom(): FakeDocument {
  const mutableDocument = {
    nodeType: 9 as const,
    documentElement: undefined as unknown as FakeElement,
    body: undefined as unknown as FakeElement,
    activeElement: null,
    defaultView: undefined as unknown as FakeWindow,

    addEventListener() {
      return;
    },

    removeEventListener() {
      return;
    },

    createElement(tagName: string) {
      const element = new FakeElement(mutableDocument as FakeDocument);
      element.tagName = tagName.toUpperCase();
      element.nodeName = element.tagName;
      return element;
    },
  };

  const document = mutableDocument as FakeDocument;
  mutableDocument.documentElement = new FakeElement(document);
  mutableDocument.body = new FakeElement(document);

  const window = {
    document,
    HTMLElement: FakeHtmlElement,
    HTMLIFrameElement: FakeHtmlIFrameElement,
    getSelection: () => null,
  } as const satisfies FakeWindow;

  mutableDocument.defaultView = window;

  Object.assign(globalThis, {
    window,
    document,
    HTMLElement: FakeHtmlElement,
    HTMLIFrameElement: FakeHtmlIFrameElement,
  });

  return document;
}

//===================================================================

const fakeDocument = installMinimalDom();

//===================================================================

const TEST_CREATED_AT = '2026-09-19T12:00:00.000Z' as ISODateTimeString;

//===================================================================

function createTestRoot(): Readonly<{ root: Root; container: FakeElement }> {
  const container = new FakeElement(fakeDocument);
  return { root: createRoot(container as unknown as Element), container };
}

//===================================================================

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}>;

//===================================================================

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

//===================================================================

function note(id: string): PharmacyNote {
  return {
    id,
    text: `Comment ${id}`,
    createdAt: TEST_CREATED_AT,
    author: { userId: '507f1f77bcf86cd799439011', displayName: 'Manager' },
  };
}

//===================================================================

function page(
  currentPage: number,
  items: PharmacyNote[],
  total = items.length,
  totalPages = total > 0 ? Math.max(currentPage, 1) : 0
): PharmacyNotesResponse {
  return { items, page: currentPage, perPage: 10, total, totalPages };
}

//===================================================================

type Resource = ReturnType<typeof useEntityCommentsResource>;
type Options = Parameters<typeof useEntityCommentsResource>[0];

//===================================================================

function createProbe(options: Options, onValue: (value: Resource) => void) {
  return function Probe() {
    onValue(useEntityCommentsResource(options));
    return null;
  };
}

//===================================================================

function requireResource(value: Resource | null): Resource {
  assert.ok(value);
  return value;
}

//===================================================================

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

//===================================================================

const noopCreate: Options['create'] = async () => {};
const noopRemove: Options['remove'] = async () => {};

//===================================================================

test('load error stays an error rather than an empty result and Retry recovers', async () => {
  let latest: Resource | null = null;
  let attempt = 0;

  const options: Options = {
    isEditable: true,
    load: async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('503');
      return page(1, [note('a')], 1, 1);
    },

    create: noopCreate,
    remove: noopRemove,
  };

  const Probe = createProbe(options, (value) => (latest = value));
  const { root } = createTestRoot();

  await act(async () => {
    root.render(createElement(Probe));
    await flush();
  });

  assert.equal(requireResource(latest).status, 'error');
  assert.notEqual(requireResource(latest).error, '');
  assert.deepEqual(requireResource(latest).data.items, []);

  await act(async () => {
    await requireResource(latest).retry();
    await flush();
  });

  assert.equal(requireResource(latest).status, 'success');
  assert.equal(requireResource(latest).data.items[0]?.id, 'a');
  await act(async () => root.unmount());
});

//===================================================================

test('a stale page response cannot overwrite a newer comments page', async () => {
  let latest: Resource | null = null;
  const second = deferred<PharmacyNotesResponse>();
  const third = deferred<PharmacyNotesResponse>();

  const options: Options = {
    isEditable: true,
    load: async (requestedPage) => {
      if (requestedPage === 1) return page(1, [note('initial')], 30, 3);
      if (requestedPage === 2) return second.promise;
      return third.promise;
    },

    create: noopCreate,
    remove: noopRemove,
  };

  const Probe = createProbe(options, (value) => (latest = value));
  const { root } = createTestRoot();

  await act(async () => {
    root.render(createElement(Probe));
    await flush();
  });

  let pageTwo!: Promise<unknown>;
  let pageThree!: Promise<unknown>;

  await act(async () => {
    pageTwo = requireResource(latest).loadPage(2);
    pageThree = requireResource(latest).loadPage(3);
    third.resolve(page(3, [note('third')], 30, 3));
    await pageThree;
    await flush();
  });

  second.resolve(page(2, [note('second')], 30, 3));

  await act(async () => {
    await pageTwo;
    await flush();
  });

  assert.equal(requireResource(latest).data.page, 3);
  assert.equal(requireResource(latest).data.items[0]?.id, 'third');
  await act(async () => root.unmount());
});

//===================================================================

test('deleting the last comment on a later page reloads the previous page', async () => {
  let latest: Resource | null = null;
  const loadedPages: number[] = [];
  const removed: string[] = [];

  const options: Options = {
    isEditable: true,
    load: async (requestedPage) => {
      loadedPages.push(requestedPage);
      return requestedPage === 2
        ? page(2, [note('last')], 11, 2)
        : page(1, [note('first')], 10, 1);
    },

    create: noopCreate,
    remove: async (id) => {
      removed.push(id);
    },
  };

  const Probe = createProbe(options, (value) => (latest = value));
  const { root } = createTestRoot();

  await act(async () => {
    root.render(createElement(Probe));
    await flush();
  });

  await act(async () => {
    await requireResource(latest).loadPage(2);
    await flush();
  });

  await act(async () => {
    requireResource(latest).requestDelete(note('last'));
    await flush();
  });

  await act(async () => {
    const result = await requireResource(latest).confirmDelete();
    assert.equal(result.status, 'success');
    await flush();
  });

  assert.deepEqual(removed, ['last']);
  assert.equal(loadedPages.at(-1), 1);
  await act(async () => root.unmount());
});

//===================================================================

test('unmount aborts an in-flight comment mutation', async () => {
  let latest: Resource | null = null;
  let capturedSignal: AbortSignal | undefined;

  const options: Options = {
    isEditable: true,
    load: async () => page(1, [], 0, 0),
    create: async (_text, mutationOptions) => {
      capturedSignal = mutationOptions.signal;
      await new Promise<void>((_resolve, reject) => {
        mutationOptions.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    },

    remove: noopRemove,
  };

  const Probe = createProbe(options, (value) => (latest = value));
  const { root } = createTestRoot();

  await act(async () => {
    root.render(createElement(Probe));
    await flush();
  });

  await act(async () => {
    requireResource(latest).setDraft('pending');
    await flush();
  });

  let pending!: ReturnType<Resource['submitDraft']>;

  await act(async () => {
    pending = requireResource(latest).submitDraft();
    await flush();
  });

  await act(async () => {
    root.unmount();
    await flush();
  });

  assert.equal(capturedSignal?.aborted, true);
  assert.equal((await pending).status, 'aborted');
});

//===================================================================

test('ambiguous create retry reuses the same client request ID until it succeeds', async () => {
  let latest: Resource | null = null;
  const requestIds: string[] = [];
  let attempt = 0;

  const options: Options = {
    isEditable: true,
    load: async () => page(1, [], 0, 0),
    create: async (_text, mutationOptions) => {
      requestIds.push(mutationOptions.clientRequestId);
      attempt += 1;
      if (attempt === 1) throw new Error('response lost');
    },

    remove: noopRemove,
  };

  const Probe = createProbe(options, (value) => (latest = value));
  const { root } = createTestRoot();

  await act(async () => {
    root.render(createElement(Probe));
    await flush();
  });

  await act(async () => {
    requireResource(latest).setDraft('same comment');
    await flush();
  });

  await act(async () => {
    const first = await requireResource(latest).submitDraft();
    assert.equal(first.status, 'error');
    await flush();
  });

  await act(async () => {
    const retry = await requireResource(latest).submitDraft();
    assert.equal(retry.status, 'success');
    await flush();
  });

  assert.equal(requestIds.length, 2);
  assert.equal(requestIds[0], requestIds[1]);
  await act(async () => root.unmount());
});
