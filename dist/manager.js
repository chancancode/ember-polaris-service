import { mapFor } from './scope.js';

const INSTANTIATE = Symbol('service:instantiate');
function setServiceManager(factory, definition) {
  Object.defineProperty(definition, INSTANTIATE, {
    configurable: false,
    enumerable: false,
    get() {
      return scope => {
        const manager = managerFor(scope, factory);
        return manager.createService(this);
      };
    }
  });
  return definition;
}
function isServiceFactory(factory) {
  return factory !== null && (typeof factory === 'object' || typeof factory === 'function') && typeof factory[INSTANTIATE] === 'function';
}
function instantiate(scope, factory) {
  return factory[INSTANTIATE](scope);
}
const Managers = new WeakMap();
function managerFor(scope, factory) {
  const managers = mapFor(scope, Managers);
  let manager = managers.get(factory);
  if (manager === undefined) {
    manager = factory(scope);
    managers.set(factory, manager);
  }
  return manager;
}

export { instantiate, isServiceFactory, setServiceManager };
//# sourceMappingURL=manager.js.map
