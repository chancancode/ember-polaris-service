import { assert } from '@ember/debug';

export type Task<T> =
  | {
      state: 'pending';
      promise: Promise<T>;
      pending: true;
      settled: false;
      terminated: false;
      resolved: false;
      rejected: false;
      aborted: false;
      abort(reason?: unknown): void;
      throwIfTerminated(): void;
    }
  | {
      state: 'resolved';
      promise: Promise<T>;
      pending: false;
      settled: true;
      terminated: false;
      resolved: true;
      rejected: false;
      aborted: false;
      value: T;
      abort(reason?: unknown): void;
      throwIfTerminated(): void;
    }
  | {
      state: 'rejected';
      promise: Promise<T>;
      pending: false;
      settled: true;
      terminated: true;
      resolved: false;
      rejected: true;
      aborted: false;
      reason: unknown;
      abort(reason?: unknown): void;
      throwIfTerminated(): never;
    }
  | {
      state: 'aborted';
      promise: Promise<T>;
      pending: false;
      settled: true;
      terminated: true;
      resolved: false;
      rejected: false;
      aborted: true;
      reason: unknown;
      abort(reason?: unknown): void;
      throwIfTerminated(): never;
    };

export type Result<T> =
  | {
      state: 'pending';
    }
  | {
      state: 'resolved';
      value: T;
    }
  | {
      state: 'rejected';
      reason: unknown;
    }
  | {
      state: 'aborted';
      reason: unknown;
    };

export abstract class AbstractTask<T> {
  protected abstract get result(): Result<T>;

  abstract get promise(): Promise<T>;

  get state(): Result<T>['state'] {
    return this.result.state;
  }

  get pending(): boolean {
    return this.result.state === 'pending';
  }

  get settled(): boolean {
    return !this.pending;
  }

  get terminated(): boolean {
    return this.settled && !this.resolved;
  }

  get resolved(): boolean {
    return this.result.state === 'resolved';
  }

  get rejected(): boolean {
    return this.result.state === 'rejected';
  }

  get aborted(): boolean {
    return this.result.state === 'aborted';
  }

  get value(): T | never {
    assert(
      `Cannot get value in the ${this.result.state} state`,
      this.result.state === 'resolved',
    );
    return this.result.value;
  }

  get reason(): unknown | never {
    assert(
      `Cannot get error in the ${this.result.state} state`,
      this.result.state === 'rejected' || this.result.state === 'aborted',
    );
    return this.result.reason;
  }

  abort(): void {}

  throwIfTerminated(): void | never {
    if (this.terminated) {
      throw this.reason;
    }
  }
}
