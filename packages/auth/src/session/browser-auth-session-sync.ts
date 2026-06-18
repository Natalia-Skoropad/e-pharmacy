export type AuthSessionEvent = 'authenticated' | 'unauthenticated';

//===================================================================

export type AuthSessionSync = {
  publish: (event: AuthSessionEvent) => void;
  subscribe: (listener: (event: AuthSessionEvent) => void) => () => void;
  close: () => void;
};

//===================================================================

const AUTH_SESSION_CHANNEL = 'e-pharmacy-auth-session';

//===================================================================

export function createBrowserAuthSessionSync(): AuthSessionSync {
  if (
    typeof window === 'undefined' ||
    typeof BroadcastChannel === 'undefined'
  ) {
    return {
      publish: () => undefined,
      subscribe: () => () => undefined,
      close: () => undefined,
    };
  }

  const channel = new BroadcastChannel(AUTH_SESSION_CHANNEL);
  const listeners = new Set<(event: AuthSessionEvent) => void>();

  channel.addEventListener('message', (message: MessageEvent<unknown>) => {
    const event = message.data;
    if (event !== 'authenticated' && event !== 'unauthenticated') return;

    listeners.forEach((listener) => listener(event));
  });

  return {
    publish: (event) => channel.postMessage(event),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => {
      listeners.clear();
      channel.close();
    },
  };
}
