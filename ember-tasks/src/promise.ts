import { registerDestructor } from '@ember/destroyable';
import { tracked } from '@glimmer/tracking';
import { type Result, AbstractTask } from './task.ts';

class Cell<T> {
  @tracked value: T;

  constructor(value: T) {
    this.value = value;
  }
}

export default class PromiseTask<T> extends AbstractTask<T> {
  // Experimental TS decorators doesn't allow private fields
  // Otherwise, this could have been @tracked #result = ...;
  #result = new Cell<Result<T>>({ state: 'pending' });

  #controller?: AbortController;

  #promise: Promise<T>;

  constructor(
    promise: Promise<T>,
    controller: AbortController | undefined,
    signal: AbortSignal | undefined,
  ) {
    super();

    promise = promise
      .then((value) => {
        if (this.pending) {
          this.#result.value = { state: 'resolved', value };
        }

        return value;
      })
      .catch((reason) => {
        if (this.pending) {
          this.#result.value = { state: 'rejected', reason };
        }

        throw reason;
      });

    if (signal) {
      const abortPromise = new Promise<T>((_, reject) => {
        signal.addEventListener('abort', () => {
          const { reason } = signal;

          if (this.pending) {
            this.#result.value = { state: 'aborted', reason };
          }

          reject(reason);
        });
      });

      promise = Promise.race([promise, abortPromise]);
    }

    if (controller) {
      this.#controller = controller;
      registerDestructor(this, () => this.abort());
    }

    this.#promise = promise;
  }

  protected get result(): Result<T> {
    return this.#result.value;
  }

  get promise(): Promise<T> {
    return this.#promise;
  }

  abort(reason?: unknown): void {
    this.#controller?.abort?.(reason);
  }
}
