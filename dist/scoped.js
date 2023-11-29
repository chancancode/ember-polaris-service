import { associateDestroyableChild } from '@ember/destroyable';
import { setScope } from './scope.js';

class Scoped {
  constructor(scope) {
    this.scope = scope;
    setScope(this, scope);
    associateDestroyableChild(scope, this);
  }
}
const Wrappers = new WeakMap();
function scoped(scope) {
  let wrapper = Wrappers.get(scope);
  if (wrapper === undefined) {
    wrapper = new Scoped(scope);
    Wrappers.set(scope, wrapper);
  }
  return wrapper;
}

export { scoped };
//# sourceMappingURL=scoped.js.map
