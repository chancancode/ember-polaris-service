import {
  type ServiceFactory,
  type ServiceManager,
  setServiceManager,
} from './manager.ts';

class Singleton<T extends object> {
  constructor(readonly value: T) {}
}

class PassthroughManager<T extends object>
  implements ServiceManager<Singleton<T>, T>
{
  createService(definition: Singleton<T>): T {
    return definition.value;
  }
}

const PASSTHROUGH_MANAGER = new PassthroughManager();

setServiceManager(() => PASSTHROUGH_MANAGER, Singleton.prototype);

const Wrappers = new WeakMap<object, Singleton<object>>();

export function singleton<T extends object>(value: T): ServiceFactory<T> {
  let wrapper = Wrappers.get(value);

  if (wrapper === undefined) {
    wrapper = new Singleton(value);
    Wrappers.set(value, wrapper);
  }

  return wrapper as unknown as ServiceFactory<T>;
}
