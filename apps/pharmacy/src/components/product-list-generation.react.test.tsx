import assert from 'node:assert/strict';
import test from 'node:test';

import { act, createElement, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { parseAllProductsSegments } from '@/lib/products/all-product-paths';
import { parseOwnProductsSegments } from '@/lib/products/own-product-paths';
import { parseProductRequestsSegments } from '@/lib/product-requests/product-request-paths';

//===================================================================

(
  globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }
).IS_REACT_ACT_ENVIRONMENT = true;

//===================================================================

class FakeHtmlElement {}
class FakeHtmlIFrameElement extends FakeHtmlElement {}

//===================================================================

class FakeElement {
  readonly nodeType = 1;
  parentNode: FakeElement | null = null;
  readonly childNodes: FakeElement[] = [];
  readonly style: Record<string, string> = {};
  tagName = 'DIV';
  nodeName = 'DIV';
  namespaceURI = 'http://www.w3.org/1999/xhtml';
  textContent = '';

  constructor(readonly ownerDocument: FakeDocument) {}

  addEventListener(): void {}
  removeEventListener(): void {}
  setAttribute(): void {}
  removeAttribute(): void {}

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

function installMinimalDom(): FakeDocument {
  const mutableDocument = {
    nodeType: 9 as const,
    documentElement: undefined as unknown as FakeElement,
    body: undefined as unknown as FakeElement,
    activeElement: null,
    defaultView: undefined as unknown as FakeWindow,
    addEventListener() {},
    removeEventListener() {},
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

async function assertGenerationRemount(firstKey: string, secondKey: string) {
  const { root } = createTestRoot();
  let setMarker: ((value: string) => void) | null = null;
  let visibleMarker = '';
  let mounts = 0;
  let unmounts = 0;

  function Probe() {
    const [marker, setLocalMarker] = useState('clean');
    setMarker = setLocalMarker;
    visibleMarker = marker;

    useEffect(() => {
      mounts += 1;
      return () => {
        unmounts += 1;
      };
    }, []);

    return null;
  }

  await act(async () => {
    root.render(createElement(Probe, { key: firstKey }));
  });

  await act(async () => {
    setMarker?.('dirty');
  });

  assert.equal(visibleMarker, 'dirty');

  await act(async () => {
    root.render(createElement(Probe, { key: firstKey }));
  });

  assert.equal(visibleMarker, 'dirty');
  assert.equal(mounts, 1);

  await act(async () => {
    root.render(createElement(Probe, { key: secondKey }));
  });

  assert.equal(visibleMarker, 'clean');
  assert.equal(mounts, 2);
  assert.equal(unmounts, 1);

  await act(async () => {
    root.unmount();
  });
}

//===================================================================

test('canonical filter generations remount all three list feature states on Back/Forward-like URL changes', async () => {
  const allFirst = JSON.stringify(parseAllProductsSegments());
  const allSecond = JSON.stringify(
    parseAllProductsSegments({ filters: ['product-name-aspirin'] })
  );

  const ownFirst = JSON.stringify(parseOwnProductsSegments());
  const ownSecond = JSON.stringify(
    parseOwnProductsSegments({ filters: ['stock-empty'] })
  );

  const requestsFirst = JSON.stringify(parseProductRequestsSegments());
  const requestsSecond = JSON.stringify(
    parseProductRequestsSegments({ filters: ['status-rejected'] })
  );

  await assertGenerationRemount(allFirst, allSecond);
  await assertGenerationRemount(ownFirst, ownSecond);
  await assertGenerationRemount(requestsFirst, requestsSecond);
});
