import {
  type ServiceFactory,
  type ServiceManager,
  setServiceManager,
  isServiceFactory,
} from './manager.ts';
import { type Scope } from './scope.ts';

type Factory<T> = (scope: Scope) => T;

class FactoryServiceManager
  implements ServiceManager<Factory<unknown>, unknown>
{
  constructor(private scope: Scope) {}

  createService<T>(factory: Factory<T>): T {
    return factory(this.scope);
  }
}

const Managers = new WeakMap<Scope, FactoryServiceManager>();

function managerFactory(scope: Scope): FactoryServiceManager {
  let manager = Managers.get(scope);

  if (manager === undefined) {
    manager = new FactoryServiceManager(scope);
    Managers.set(scope, manager);
  }

  return manager;
}

export function factory<F extends Factory<unknown>>(
  f: F,
): F & ServiceFactory<ReturnType<F>> {
  if (!isServiceFactory(f)) {
    setServiceManager(managerFactory, f);
  }

  return f as F & ServiceFactory<ReturnType<F>>;
}
