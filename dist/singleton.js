import { setServiceManager } from './manager.js';

class SingletonService {
  constructor(value) {
    this.value = value;
  }
}
class SingletonServiceManager {
  createService(definition) {
    return definition.value;
  }
}
const SINGLETON_SERVICE_MANAGER = new SingletonServiceManager();
const SINGLETON_SERVICE_MANAGER_FACTORY = () => SINGLETON_SERVICE_MANAGER;
setServiceManager(SINGLETON_SERVICE_MANAGER_FACTORY, SingletonService.prototype);
const Wrappers = new WeakMap();
function singleton(value) {
  let wrapper = Wrappers.get(value);
  if (wrapper === undefined) {
    wrapper = new SingletonService(value);
    Wrappers.set(value, wrapper);
  }
  return wrapper;
}

export { singleton };
//# sourceMappingURL=singleton.js.map
