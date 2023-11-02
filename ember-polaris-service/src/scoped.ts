import { associateDestroyableChild } from '@ember/destroyable';
import { type Scope, setScope } from './scope.ts';

class Scoped implements Scope {
  constructor(readonly scope: Scope) {
    setScope(this, scope);
    associateDestroyableChild(scope, this);
  }
}

const Wrappers = new WeakMap<Scope, Scoped>();

export function scoped(scope: Scope): Scope {
  let wrapper = Wrappers.get(scope);

  if (wrapper === undefined) {
    wrapper = new Scoped(scope);
    Wrappers.set(scope, wrapper);
  }

  return wrapper;
}
