import assert from 'node:assert/strict';
import test from 'node:test';

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { useLastKnownStatistics } from './useLastKnownStatistics';

//===================================================================

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

//===================================================================

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

function createTestRoot(): Readonly<{ root: Root; container: FakeElement }> {
  const container = new FakeElement(fakeDocument);
  return { root: createRoot(container as unknown as Element), container };
}

//===================================================================

type Statistics = Readonly<{ total: number; active: number }>;
type Resource = ReturnType<typeof useLastKnownStatistics<Statistics>>;

//===================================================================

function createProbe(onValue: (value: Resource) => void) {
  return function Probe() {
    onValue(useLastKnownStatistics<Statistics>());
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
}

//===================================================================

test('initial loading and failure never synthesize zero statistics', async () => {
  let latest: Resource | null = null;

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(createElement(Probe));
    await flush();
  });

  assert.equal(requireResource(latest).data, null);
  assert.equal(requireResource(latest).status, 'idle');

  await act(async () => {
    requireResource(latest).startLoading();
    await flush();
  });

  assert.equal(requireResource(latest).data, null);
  assert.equal(requireResource(latest).status, 'loading');

  await act(async () => {
    requireResource(latest).setFailure();
    await flush();
  });

  assert.equal(requireResource(latest).data, null);
  assert.equal(requireResource(latest).status, 'error');

  await act(async () => {
    root.unmount();
    await flush();
  });
});

//===================================================================

test('refresh loading and failure preserve the last-known-good statistics', async () => {
  let latest: Resource | null = null;

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();
  const statistics = { total: 12, active: 7 } as const;

  await act(async () => {
    root.render(createElement(Probe));
    await flush();
  });

  await act(async () => {
    requireResource(latest).setSuccess(statistics);
    await flush();
  });

  assert.deepEqual(requireResource(latest).data, statistics);
  assert.equal(requireResource(latest).status, 'success');

  await act(async () => {
    requireResource(latest).startLoading();
    await flush();
  });

  assert.deepEqual(requireResource(latest).data, statistics);
  assert.equal(requireResource(latest).status, 'loading');

  await act(async () => {
    requireResource(latest).setFailure();
    await flush();
  });

  assert.deepEqual(requireResource(latest).data, statistics);
  assert.equal(requireResource(latest).status, 'error');

  await act(async () => {
    root.unmount();
    await flush();
  });
});
