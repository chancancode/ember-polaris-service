import {
  type ServiceFactory,
  type ServiceManager,
  setServiceManager,
} from './manager.ts';

class SingletonService<T extends object> {
  constructor(readonly value: T) {}
}

class SingletonServiceManager<T extends object>
  implements ServiceManager<SingletonService<T>, T>
{
  createService(definition: SingletonService<T>): T {
    return definition.value;
  }
}

const SINGLETON_SERVICE_MANAGER = new SingletonServiceManager();
const SINGLETON_SERVICE_MANAGER_FACTORY = () => SINGLETON_SERVICE_MANAGER;

setServiceManager(
  SINGLETON_SERVICE_MANAGER_FACTORY,
  SingletonService.prototype,
);

const Wrappers = new WeakMap<object, SingletonService<object>>();

export function singleton<T extends object>(value: T): ServiceFactory<T> {
  let wrapper = Wrappers.get(value);

  if (wrapper === undefined) {
    wrapper = new SingletonService(value);
    Wrappers.set(value, wrapper);
  }

  return wrapper as unknown as ServiceFactory<T>;
}
