import { type Result, AbstractTask } from './task.ts';

export default class AbortedTask<T> extends AbstractTask<T> {
  #reason: unknown;

  constructor(reason?: unknown) {
    super();
    this.#reason = reason;
  }

  protected get result(): Result<T> {
    return { state: 'aborted', reason: this.#reason };
  }

  get promise(): Promise<T> {
    return Promise.reject(this.#reason);
  }
}
