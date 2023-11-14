import { assert, runInDebug } from '@ember/debug';
import { TrackedMap } from 'tracked-built-ins';

export type Params<P> = { readonly [key in keyof P]: string };

export class TrackedRouteParams<P extends Params<P>> {
  static from<P extends Params<P>>(
    params: P,
  ): Params<P> & TrackedRouteParams<P> {
    const p = new TrackedRouteParams(params);

    for (const key of Object.keys(params)) {
      Object.defineProperty(p, key, {
        get() {
          return p.#tracked.get(key);
        },
      });
    }

    return p as P & TrackedRouteParams<P>;
  }

  static update<P extends Params<P>>(
    params: TrackedRouteParams<P>,
    update: P,
  ): void {
    assert(
      `params is not an instance of TrackedRouteParams`,
      #params in params,
    );

    params.#update(update);
  }

  #params: P;
  #tracked = new TrackedMap<string, string>();

  private constructor(params: P) {
    this.#params = params;

    for (const [key, value] of Object.entries(params)) {
      assert(`params key must be a string`, typeof key === 'string');
      assert(`params value must be a string`, typeof value === 'string');
      this.#tracked.set(key, value);
    }
  }

  #update(params: P): void {
    runInDebug(() => {
      const newKeys = new Set(Object.keys(params));
      const oldKeys = new Set(Object.keys(params));

      for (const key of newKeys) {
        assert(`params key must be a string`, typeof key === 'string');

        if (oldKeys.has(key)) {
          newKeys.delete(key);
          oldKeys.delete(key);
        } else {
          assert(`new params contain unexpected key ${key}`);
        }
      }

      for (const key of oldKeys) {
        assert(`new params is missing expected key ${key}`);
      }
    });

    for (const [key, value] of Object.entries(params)) {
      if (this.#params[key as keyof P] !== params[key as keyof P]) {
        this.#tracked.set(key, value as string);
      }
    }

    this.#params = params;
  }
}
