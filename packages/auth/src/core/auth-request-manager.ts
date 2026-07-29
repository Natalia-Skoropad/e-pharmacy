export type AuthRequestKind = 'current-user' | 'login' | 'register' | 'logout';

//===================================================================

export type AuthRequestAttempt<TValue> = Readonly<{
  id: number;
  lifecycleId: number;
  kind: AuthRequestKind;
  controller: AbortController;
  promise: Promise<TValue>;
}>;

//===================================================================

type RequestFactory<TValue> = (signal: AbortSignal) => Promise<TValue>;

//===================================================================

export class AuthRequestManager {
  private lifecycleId = 0;
  private nextAttemptId = 0;
  private readonly activeAttempts = new Map<
    AuthRequestKind,
    AuthRequestAttempt<unknown>
  >();

  private readonly latestAttemptIds = new Map<AuthRequestKind, number>();

  getCurrentLifecycleId(): number {
    return this.lifecycleId;
  }

  advanceLifecycle(): number {
    this.lifecycleId += 1;
    this.abortAll();
    return this.lifecycleId;
  }

  start<TValue>(
    kind: AuthRequestKind,
    factory: RequestFactory<TValue>,
    options: Readonly<{ singleFlight?: boolean }> = {}
  ): AuthRequestAttempt<TValue> {
    const existing = this.activeAttempts.get(kind) as
      | AuthRequestAttempt<TValue>
      | undefined;

    if (
      options.singleFlight &&
      existing &&
      existing.lifecycleId === this.lifecycleId &&
      !existing.controller.signal.aborted
    ) {
      return existing;
    }

    existing?.controller.abort();

    const controller = new AbortController();
    const id = ++this.nextAttemptId;
    const lifecycleId = this.lifecycleId;

    const promise = Promise.resolve()
      .then(() => factory(controller.signal))
      .finally(() => {
        const activeAttempt = this.activeAttempts.get(kind);

        if (
          activeAttempt?.id === id &&
          activeAttempt.lifecycleId === lifecycleId
        ) {
          this.activeAttempts.delete(kind);
        }
      });

    const attempt: AuthRequestAttempt<TValue> = {
      id,
      lifecycleId,
      kind,
      controller,
      promise,
    };

    this.latestAttemptIds.set(kind, id);
    this.activeAttempts.set(kind, attempt as AuthRequestAttempt<unknown>);
    return attempt;
  }

  isCurrent(attempt: AuthRequestAttempt<unknown>): boolean {
    return (
      !attempt.controller.signal.aborted &&
      attempt.lifecycleId === this.lifecycleId &&
      this.latestAttemptIds.get(attempt.kind) === attempt.id
    );
  }

  cancel(attempt: AuthRequestAttempt<unknown>): void {
    attempt.controller.abort();
    if (this.activeAttempts.get(attempt.kind) === attempt) {
      this.activeAttempts.delete(attempt.kind);
    }
  }

  abortAll(): void {
    for (const attempt of this.activeAttempts.values()) {
      attempt.controller.abort();
    }
    this.activeAttempts.clear();
  }
}
