class FakeNode extends EventTarget {
  parentElement: FakeElement | null = null;
}

//===================================================================

export class FakeElement extends FakeNode {
  readonly children: FakeElement[] = [];
  readonly style: Record<string, string> = {
    overflow: '',
    paddingRight: '',
  };

  inert = false;
  isConnected = false;
  isContentEditable = false;
  tabIndex = -1;
  disabled = false;
  display = 'block';
  visibility = 'visible';
  computedPaddingRight = '0px';

  private readonly attributes = new Map<string, string>();

  readonly tagName: string;

  constructor(tagName = 'div') {
    super();
    this.tagName = tagName;
  }

  appendChild(child: FakeElement): FakeElement {
    child.parentElement = this;
    this.children.push(child);
    child.setConnected(this.isConnected);
    return child;
  }

  removeChild(child: FakeElement): FakeElement {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
    child.parentElement = null;
    child.setConnected(false);
    return child;
  }

  setConnected(value: boolean): void {
    this.isConnected = value;
    for (const child of this.children) child.setConnected(value);
  }

  contains(target: unknown): boolean {
    if (target === this) return true;
    return this.children.some((child) => child.contains(target));
  }

  querySelectorAll<TElement extends Element>(): TElement[] {
    const descendants: FakeElement[] = [];

    const visit = (element: FakeElement) => {
      for (const child of element.children) {
        descendants.push(child);
        visit(child);
      }
    };

    visit(this);
    return descendants as unknown as TElement[];
  }

  closest(selector: string): FakeElement | null {
    if (
      selector.includes('[hidden]') &&
      (this.hasAttribute('hidden') ||
        this.inert ||
        this.getAttribute('aria-hidden') === 'true')
    ) {
      return this;
    }

    if (
      selector === 'fieldset:disabled' &&
      this instanceof FakeFieldSetElement &&
      this.disabled
    ) {
      return this;
    }

    return this.parentElement?.closest(selector) ?? null;
  }

  matches(selector: string): boolean {
    if (selector === 'script, style') {
      return this.tagName === 'script' || this.tagName === 'style';
    }

    return false;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'tabindex') this.tabIndex = Number(value);
    if (name === 'disabled') this.disabled = true;
    if (name === 'contenteditable') this.isContentEditable = value === 'true';
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
    if (name === 'disabled') this.disabled = false;
  }

  focus(): void {
    fakeDocument.activeElement = this;
  }
}

//===================================================================

class FakeFieldSetElement extends FakeElement {}
class FakeLegendElement extends FakeElement {}

//===================================================================

class FakeDocument extends EventTarget {
  readonly body = new FakeElement('body');
  readonly documentElement = new FakeElement('html');
  activeElement: FakeElement | null = this.body;

  constructor() {
    super();
    this.body.setConnected(true);
    this.documentElement.setConnected(true);
    Object.defineProperty(this.documentElement, 'clientWidth', {
      value: 980,
      configurable: true,
    });
  }

  createElement(tagName: string): FakeElement {
    if (tagName === 'fieldset') return new FakeFieldSetElement(tagName);
    if (tagName === 'legend') return new FakeLegendElement(tagName);
    return new FakeElement(tagName);
  }
}

//===================================================================

class FakeMutationObserver {
  private readonly callback: MutationCallback;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe(): void {
    void this.callback;
  }

  disconnect(): void {}
}

//===================================================================

export class FakeKeyboardEvent extends Event {
  readonly key: string;
  readonly shiftKey: boolean;
  propagationStopped = false;

  constructor(key: string, options: { shiftKey?: boolean } = {}) {
    super('keydown', { bubbles: true, cancelable: true });
    this.key = key;
    this.shiftKey = options.shiftKey ?? false;
  }

  stopPropagation(): void {
    this.propagationStopped = true;
    super.stopPropagation();
  }
}

//===================================================================

export const fakeDocument = new FakeDocument();

//===================================================================

export function dispatchBubblingKeyboardEvent(
  target: FakeElement,
  event: FakeKeyboardEvent
): void {
  const path: EventTarget[] = [];
  let current: FakeElement | null = target;

  while (current) {
    path.push(current);
    current = current.parentElement;
  }

  path.push(fakeDocument);

  Object.defineProperty(event, 'composedPath', {
    configurable: true,
    value: () => [...path],
  });

  for (const eventTarget of path) {
    eventTarget.dispatchEvent(event);
    if (event.propagationStopped) break;
  }
}

let nextFrameId = 1;
const frameCallbacks = new Map<number, FrameRequestCallback>();

//===================================================================

export const fakeWindow = {
  innerWidth: 1000,
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = nextFrameId;
    nextFrameId += 1;
    frameCallbacks.set(id, callback);
    return id;
  },
  cancelAnimationFrame(id: number): void {
    frameCallbacks.delete(id);
  },
  getComputedStyle(element: FakeElement) {
    return {
      display: element.display,
      visibility: element.visibility,
      paddingRight: element.computedPaddingRight,
    };
  },
};

//===================================================================

export function installFakeDom(): void {
  Object.assign(globalThis, {
    Node: FakeNode,
    Element: FakeElement,
    HTMLElement: FakeElement,
    HTMLFieldSetElement: FakeFieldSetElement,
    HTMLLegendElement: FakeLegendElement,
    MutationObserver: FakeMutationObserver,
    KeyboardEvent: FakeKeyboardEvent,
    document: fakeDocument,
    window: fakeWindow,
  });
}

//===================================================================

export function resetFakeDom(): void {
  for (const child of [...fakeDocument.body.children]) {
    fakeDocument.body.removeChild(child);
  }

  fakeDocument.body.style.overflow = '';
  fakeDocument.body.style.paddingRight = '';
  fakeDocument.body.computedPaddingRight = '0px';
  fakeDocument.activeElement = fakeDocument.body;
  frameCallbacks.clear();
}

//===================================================================

export function flushAnimationFrames(): void {
  const callbacks = [...frameCallbacks.entries()];
  frameCallbacks.clear();

  for (const [id, callback] of callbacks) callback(id);
}

//===================================================================

export function createFocusable(tagName = 'button'): FakeElement {
  const element = new FakeElement(tagName);
  element.tabIndex = 0;
  return element;
}

//===================================================================

export function getPendingAnimationFrameCount(): number {
  return frameCallbacks.size;
}
