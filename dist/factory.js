import { isServiceFactory, setServiceManager } from './manager.js';
import '@ember/application';
import '@ember/debug';

class FactoryServiceManager {
  constructor(scope) {
    this.scope = scope;
  }
  createService(factory) {
    return factory(this.scope);
  }
}
const Managers = new WeakMap();
function managerFactory(scope) {
  let manager = Managers.get(scope);
  if (manager === undefined) {
    manager = new FactoryServiceManager(scope);
    Managers.set(scope, manager);
  }
  return manager;
}
function factory(f) {
  if (!isServiceFactory(f)) {
    setServiceManager(managerFactory, f);
  }
  return f;
}

export { factory };
//# sourceMappingURL=factory.js.map
