import { type Scope, mapFor } from './scope.ts';

const INSTANTIATE = Symbol('service:instantiate');

export interface ServiceFactory<T> {
  [INSTANTIATE]: (scope: Scope) => T;
}

export interface ServiceManager<D extends object, T> {
  createService(definition: D): T;
}

export interface ServiceManagerFactory<D extends object, T> {
  (scope: Scope): ServiceManager<D, T>;
}

export function setServiceManager<D extends object, T>(
  factory: ServiceManagerFactory<D, T>,
  definition: D,
): D & ServiceFactory<T> {
  Object.defineProperty(definition, INSTANTIATE, {
    configurable: false,
    enumerable: false,
    get(this: D) {
      return (scope: Scope) => {
        const manager = managerFor(scope, factory);
        return manager.createService(this);
      };
    },
  });

  return definition as D & ServiceFactory<T>;
}

export function isServiceFactory<T = unknown>(
  factory: unknown,
): factory is ServiceFactory<T> {
  return (
    factory !== null &&
    (typeof factory === 'object' || typeof factory === 'function') &&
    typeof (factory as Partial<ServiceFactory<T>>)[INSTANTIATE] === 'function'
  );
}

export function instantiate<T>(scope: Scope, factory: ServiceFactory<T>): T {
  return factory[INSTANTIATE](scope);
}

type InstantiatedManagers = WeakMap<
  ServiceManagerFactory<object, unknown>,
  ServiceManager<object, unknown>
>;

const Managers = new WeakMap<Scope, InstantiatedManagers>();

function managerFor<D extends object, T>(
  scope: Scope,
  factory: ServiceManagerFactory<D, T>,
): ServiceManager<D, T> {
  const managers = mapFor(scope, Managers);
  let manager = managers.get(factory) as ServiceManager<D, T> | undefined;

  if (manager === undefined) {
    manager = factory(scope);
    managers.set(factory, manager);
  }

  return manager;
}
