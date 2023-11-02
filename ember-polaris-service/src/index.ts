export { lookup, override } from './primitives.ts';
export {
  type ServiceFactory,
  type ServiceManager,
  setServiceManager,
  isServiceFactory,
} from './manager.ts';
export { type Scope, getScope, setScope } from './scope.ts';
export { scoped } from './scoped.ts';
export { singleton } from './singleton.ts';

import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
import { lookup } from './primitives.ts';
import {
  type ServiceFactory,
  setServiceManager,
  isServiceFactory,
} from './manager.ts';
import { type Scope, getScope, setScope } from './scope.ts';

// Is this cheating?
export function service<S extends ServiceConstructor<unknown>>(
  scopable: object,
  factory: S,
): InstanceType<S>;
export function service<T>(scopable: object, factory: ServiceFactory<T>): T;
export function service<T>(scopable: object, factory: ServiceFactory<T>): T {
  const scope = getScope(scopable);

  assert(
    'The first argument passed to `service()` does not have a valid Scope. ' +
      'Did you forget to call `setScope()` or `setOwner`?',
    scope !== undefined,
  );

  assert(
    'The second argument passed to `service()` is not a valid ServiceFactory. ' +
      'Did you forget to call `setServiceManager()`?',
    isServiceFactory(factory),
  );

  return lookup(scope, factory);
}

class Service {
  constructor(scope: Scope) {
    setScope(this, scope);
    // Should this be part of `lookup`, in general?
    associateDestroyableChild(scope, this);
  }
}

type ServiceConstructor<T> = typeof Service &
  ServiceFactory<T> & { new (scope: Scope): T };

class ServiceManager {
  constructor(private scope: Scope) {}

  createService<T extends Service>(Service: new (scope: Scope) => T): T {
    return new Service(this.scope);
  }
}

export default setServiceManager(
  (scope: Scope) => new ServiceManager(scope),
  Service,
);
