import { type Result, AbstractTask } from './task.ts';

export default class ResolvedTask<T> extends AbstractTask<T> {
  #value: T;

  constructor(value: T) {
    super();
    this.#value = value;
  }

  protected get result(): Result<T> {
    return { state: 'resolved', value: this.#value };
  }

  get promise(): Promise<T> {
    return Promise.resolve(this.#value);
  }
}
