import { type Result, AbstractTask } from './task.ts';

export default class PendingTask<T> extends AbstractTask<T> {
  #promise = new Promise<T>(() => {});

  protected get result(): Result<T> {
    return { state: 'pending' };
  }

  get promise(): Promise<T> {
    return this.#promise;
  }
}
