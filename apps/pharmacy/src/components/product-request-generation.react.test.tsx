import assert from 'node:assert/strict';
import test from 'node:test';

import { act, createElement, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

import { normalizeProductRequestsResponse } from '../lib/product-requests/product-requests';

import { ProductRequestStatusBadges } from './product-requests/ProductRequestStatusBadges';
import { getProductRequestGenerationKey } from './product-requests/NewProductRequestPageContent/product-request-page-mode';

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

test('changing the product-request generation key remounts local UI state', async () => {
  const { root } = createTestRoot();

  let setDraftMarker: ((value: string) => void) | null = null;
  let visibleMarker = '';
  let mounts = 0;
  let unmounts = 0;

  function Probe() {
    const [marker, setMarker] = useState('clean');

    setDraftMarker = setMarker;
    visibleMarker = marker;

    useEffect(() => {
      mounts += 1;

      return () => {
        unmounts += 1;
      };
    }, []);

    return null;
  }

  const firstKey = getProductRequestGenerationKey({ requestId: 'request-a' });
  const secondKey = getProductRequestGenerationKey({ requestId: 'request-b' });

  await act(async () => {
    root.render(createElement(Probe, { key: firstKey }));
  });

  await act(async () => {
    setDraftMarker?.('dirty');
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
});

//===================================================================

test('registry response renders the same status badges before and after resubmission', () => {
  const item = {
    id: '507f1f77bcf86cd799439011',
    createdAt: '2026-11-26T10:00:00.000Z',
    productName: 'Lactase Enzyme Capsules',
    productArticle: 'EPH-0478',
    categoryMode: 'catalog',

    category: {
      id: '507f1f77bcf86cd799439099',
      name: 'Care',
      slug: 'care',
    },

    status: 'on_moderation',
  };

  const render = (reviewState?: 'changes_requested') => {
    const response = normalizeProductRequestsResponse({
      items: [{ ...item, reviewState }],
      page: 1,
      perPage: 20,
      total: 1,
      totalPages: 1,
      earliestCreatedAt: '2026-11-26',
    });

    const request = response.items[0];

    assert.ok(request);

    return renderToStaticMarkup(
      <ProductRequestStatusBadges request={request} />
    );
  };

  const corrections = render('changes_requested');

  assert.match(corrections, /On moderation/);
  assert.match(corrections, /Needs changes/);
  assert.match(corrections, /neutral/);

  const resubmitted = render();

  assert.match(resubmitted, /On moderation/);
  assert.doesNotMatch(resubmitted, /Needs changes/);
});
