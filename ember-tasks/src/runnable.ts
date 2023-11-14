import PromiseTask from './promise.ts';

export type RunnableFunction<T> = (signal: AbortSignal) => Runnable<T>;
export type Runnable<T> =
  | T
  | Promise<T>
  | Generator<void, T, void>
  | AsyncGenerator<void, T, void>;

function isFunction(fn: unknown): fn is (...args: unknown[]) => unknown {
  return typeof fn === 'function';
}

function isGenerator(obj: object): obj is Generator {
  return (
    isFunction(Reflect.get(obj, Symbol.iterator)) &&
    isFunction(Reflect.get(obj, 'next')) &&
    isFunction(Reflect.get(obj, 'return')) &&
    isFunction(Reflect.get(obj, 'throw'))
  );
}

function isAsyncGenerator(obj: object): obj is AsyncGenerator {
  return (
    isFunction(Reflect.get(obj, Symbol.asyncIterator)) &&
    isFunction(Reflect.get(obj, 'next')) &&
    isFunction(Reflect.get(obj, 'return')) &&
    isFunction(Reflect.get(obj, 'throw'))
  );
}

export default class RunnableTask<T> extends PromiseTask<T> {
  constructor(
    fn: RunnableFunction<T>,
    controller: AbortController | undefined,
    signal: AbortSignal,
  ) {
    const promise = Promise.resolve().then(() => this.#run(fn(signal), signal));

    super(promise, controller, signal);
  }

  async #run(runnable: Runnable<T>, signal: AbortSignal): Promise<T> {
    if (runnable !== null && typeof runnable === 'object') {
      if (isGenerator(runnable) || isAsyncGenerator(runnable)) {
        return await this.#poll(runnable, signal);
      }
    }

    return await runnable;
  }

  async #poll(
    generator: Generator | AsyncGenerator,
    signal: AbortSignal,
  ): Promise<T> {
    for (;;) {
      const result = await generator.next();

      if (result.done) {
        return result.value;
      }

      if (signal.aborted) {
        generator.throw(signal.reason);
        throw signal.reason;
      }
    }
  }
}
