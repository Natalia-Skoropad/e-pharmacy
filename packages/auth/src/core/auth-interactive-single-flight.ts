export type AuthInteractiveRequestKind = 'login' | 'register';

//===================================================================

type InteractiveFlight<TValue> = Readonly<{
  key: string;
  promise: Promise<TValue>;
}>;

//===================================================================

export class AuthInteractiveSingleFlight {
  private readonly active = new Map<
    AuthInteractiveRequestKind,
    InteractiveFlight<unknown>
  >();

  run<TValue>(
    kind: AuthInteractiveRequestKind,
    key: string,
    factory: () => Promise<TValue>
  ): Promise<TValue> {
    const existing = this.active.get(kind) as
      | InteractiveFlight<TValue>
      | undefined;

    if (existing?.key === key) {
      return existing.promise;
    }

    const promise = Promise.resolve()
      .then(factory)
      .finally(() => {
        const current = this.active.get(kind);
        if (current?.promise === promise) {
          this.active.delete(kind);
        }
      });

    this.active.set(kind, { key, promise });
    return promise;
  }

  clear(): void {
    this.active.clear();
  }
}

//===================================================================

export function createAuthInteractiveRequestKey(value: unknown): string {
  return JSON.stringify(value);
}
