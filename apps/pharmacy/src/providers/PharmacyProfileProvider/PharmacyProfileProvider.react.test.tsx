import assert from 'node:assert/strict';
import test from 'node:test';

import { StrictMode, act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type {
  CurrentPharmacySummary,
  CurrentPharmacySummaryResponse,
  MyPharmacyProfile,
} from '@e-pharmacy/types/pharmacies';

import {
  PharmacyProfileProviderRuntime,
  usePharmacyProfile,
} from './PharmacyProfileProvider';

//===================================================================

(
  globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }
).IS_REACT_ACT_ENVIRONMENT = true;

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

class FakeHtmlElement {}
class FakeHtmlIFrameElement extends FakeHtmlElement {}

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
  const root = createRoot(container as unknown as Element);
  return { root, container };
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

function createSummary(
  id: string,
  name: string,
  status: CurrentPharmacySummary['status'] = 'active'
): CurrentPharmacySummary {
  return {
    id: id as CurrentPharmacySummary['id'],
    name,
    status,
    membershipRole: 'owner',
  };
}

//===================================================================

function createFullProfile(summary: CurrentPharmacySummary): MyPharmacyProfile {
  return {
    ...summary,
    bankTransferAvailable: false,
    documents: [],
    rating: 0,
    reviewsCount: 0,
    updatedAt: '2026-09-11T00:00:00.000Z' as MyPharmacyProfile['updatedAt'],
  };
}

//===================================================================

function authenticated(id: string) {
  return {
    user: { id, role: 'pharmacy' },
    isBootstrapping: false,
    canRenderAuthenticatedContent: true,
  } as const;
}

//===================================================================

const unauthenticated = {
  user: null,
  isBootstrapping: false,
  canRenderAuthenticatedContent: false,
} as const;

//===================================================================

type ProfileContext = ReturnType<typeof usePharmacyProfile>;

//===================================================================

function createProbe(onValue: (value: ProfileContext) => void) {
  return function Probe() {
    onValue(usePharmacyProfile());
    return null;
  };
}

//===================================================================

function requireContext(value: ProfileContext | null): ProfileContext {
  assert.ok(value);
  return value;
}

//===================================================================

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

//===================================================================

test('unauthenticated state performs no summary request; authenticated pharmacy loads once', async () => {
  let latest: ProfileContext | null = null;
  let calls = 0;
  const summary = createSummary('507f1f77bcf86cd799439011', 'Alpha Pharmacy');

  const loadSummary = async (): Promise<CurrentPharmacySummaryResponse> => {
    calls += 1;
    return { pharmacy: summary };
  };

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: unauthenticated,
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  assert.equal(calls, 0);
  assert.equal(requireContext(latest).profile, null);

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated('507f1f77bcf86cd799439011'),
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  assert.equal(calls, 1);
  assert.deepEqual(requireContext(latest).profile, summary);

  await act(async () => {
    root.unmount();
    await flush();
  });
});

//===================================================================

test('initial failure exposes error and retry can recover', async () => {
  let latest: ProfileContext | null = null;
  let attempt = 0;
  const error = new Error('503');
  const summary = createSummary('507f1f77bcf86cd799439011', 'Alpha Pharmacy');

  const loadSummary = async (): Promise<CurrentPharmacySummaryResponse> => {
    attempt += 1;
    if (attempt === 1) throw error;
    return { pharmacy: summary };
  };

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated(summary.id),
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  assert.equal(requireContext(latest).profile, null);
  assert.equal(requireContext(latest).error, error);

  await act(async () => {
    await requireContext(latest).refresh();
    await flush();
  });

  assert.deepEqual(requireContext(latest).profile, summary);
  assert.equal(requireContext(latest).error, null);

  await act(async () => {
    root.unmount();
    await flush();
  });
});

//===================================================================

test('refresh transport failure preserves the last-known-good summary', async () => {
  let latest: ProfileContext | null = null;
  let attempt = 0;
  const summary = createSummary('507f1f77bcf86cd799439011', 'Alpha Pharmacy');
  const error = new Error('503');

  const loadSummary = async (): Promise<CurrentPharmacySummaryResponse> => {
    attempt += 1;
    if (attempt === 1) return { pharmacy: summary };
    throw error;
  };

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated(summary.id),
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  await act(async () => {
    await requireContext(latest).refresh();
    await flush();
  });

  assert.deepEqual(requireContext(latest).profile, summary);
  assert.equal(requireContext(latest).error, error);

  await act(async () => {
    root.unmount();
    await flush();
  });
});

//===================================================================

test('account switch ignores an older account response and logout clears private state', async () => {
  let latest: ProfileContext | null = null;
  const a = deferred<CurrentPharmacySummaryResponse>();
  const b = deferred<CurrentPharmacySummaryResponse>();
  let calls = 0;

  const loadSummary = (): Promise<CurrentPharmacySummaryResponse> => {
    calls += 1;
    return calls === 1 ? a.promise : b.promise;
  };

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated('507f1f77bcf86cd799439011'),
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated('507f1f77bcf86cd799439012'),
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  b.resolve({
    pharmacy: createSummary('507f1f77bcf86cd799439012', 'Beta Pharmacy'),
  });

  await act(flush);

  a.resolve({
    pharmacy: createSummary('507f1f77bcf86cd799439011', 'Alpha Pharmacy'),
  });

  await act(flush);

  assert.equal(requireContext(latest).profile?.id, '507f1f77bcf86cd799439012');

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: unauthenticated,
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  assert.equal(requireContext(latest).profile, null);

  await act(async () => {
    root.unmount();
    await flush();
  });
});

//===================================================================

test('newer reload wins when concurrent refreshes resolve out of order', async () => {
  let latest: ProfileContext | null = null;
  const initial = createSummary('507f1f77bcf86cd799439011', 'Initial');
  const first = deferred<CurrentPharmacySummaryResponse>();
  const second = deferred<CurrentPharmacySummaryResponse>();
  let calls = 0;

  const loadSummary = async (): Promise<CurrentPharmacySummaryResponse> => {
    calls += 1;
    if (calls === 1) return { pharmacy: initial };
    if (calls === 2) return first.promise;
    return second.promise;
  };

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated(initial.id),
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  let firstRefresh!: Promise<CurrentPharmacySummary | null>;
  let secondRefresh!: Promise<CurrentPharmacySummary | null>;

  await act(async () => {
    firstRefresh = requireContext(latest).refresh();
    secondRefresh = requireContext(latest).refresh();
    await flush();
  });

  second.resolve({
    pharmacy: createSummary(initial.id, 'Newest'),
  });
  await act(flush);

  first.resolve({
    pharmacy: createSummary(initial.id, 'Older'),
  });

  await act(async () => {
    await Promise.all([firstRefresh, secondRefresh]);
    await flush();
  });

  assert.equal(requireContext(latest).profile?.name, 'Newest');

  await act(async () => {
    root.unmount();
    await flush();
  });
});

//===================================================================

test('authoritative mutation sync prevents an older GET from overwriting state', async () => {
  let latest: ProfileContext | null = null;
  const pending = deferred<CurrentPharmacySummaryResponse>();
  const id = '507f1f77bcf86cd799439011';

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated(id),
          loadSummary: () => pending.promise,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  const authoritative = createSummary(id, 'Mutation Result');

  await act(async () => {
    requireContext(latest).syncProfile(createFullProfile(authoritative));
    await flush();
  });

  pending.resolve({
    pharmacy: createSummary(id, 'Stale GET'),
  });

  await act(flush);

  assert.equal(requireContext(latest).profile?.name, 'Mutation Result');

  await act(async () => {
    root.unmount();
    await flush();
  });
});

//===================================================================

test('unmount aborts the active request and its later response cannot commit', async () => {
  let latest: ProfileContext | null = null;
  const pending = deferred<CurrentPharmacySummaryResponse>();
  let signal: AbortSignal | undefined;
  const id = '507f1f77bcf86cd799439011';

  const loadSummary = (
    options?: Readonly<{ signal?: AbortSignal }>
  ): Promise<CurrentPharmacySummaryResponse> => {
    signal = options?.signal;
    return pending.promise;
  };

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        PharmacyProfileProviderRuntime,
        {
          authState: authenticated(id),
          loadSummary,
        },
        createElement(Probe)
      )
    );
    await flush();
  });

  assert.ok(signal);
  assert.equal(signal.aborted, false);
  assert.equal(requireContext(latest).profile, null);

  await act(async () => {
    root.unmount();
    await flush();
  });

  assert.equal(signal.aborted, true);

  pending.resolve({
    pharmacy: createSummary(id, 'Obsolete after unmount'),
  });

  await flush();

  assert.equal(requireContext(latest).profile, null);
});

//===================================================================

test('StrictMode lifecycle settles on the current pharmacy summary', async () => {
  let latest: ProfileContext | null = null;
  let calls = 0;
  const summary = createSummary(
    '507f1f77bcf86cd799439011',
    'Strict Mode Pharmacy'
  );

  const loadSummary = async (): Promise<CurrentPharmacySummaryResponse> => {
    calls += 1;
    return { pharmacy: summary };
  };

  const Probe = createProbe((value) => {
    latest = value;
  });

  const { root } = createTestRoot();

  await act(async () => {
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(
          PharmacyProfileProviderRuntime,
          {
            authState: authenticated(summary.id),
            loadSummary,
          },
          createElement(Probe)
        )
      )
    );
    await flush();
  });

  assert.ok(calls >= 1);
  assert.deepEqual(requireContext(latest).profile, summary);

  await act(async () => {
    root.unmount();
    await flush();
  });
});
