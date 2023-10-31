export { lookup, override } from './primitives.ts';
export {
  type ServiceFactory,
  type ServiceManager,
  setServiceManager,
} from './manager.ts';
export { type Scope, getScope, setScope } from './scope.ts';

import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
import { lookup } from './primitives.ts';
import { type ServiceFactory, setServiceManager } from './manager.ts';
import { type Scope, getScope, setScope } from './scope.ts';

// Is this cheating?
export function service<S extends ServiceConstructor<unknown>>(
  factory: S,
  scopable: object,
): InstanceType<S>;
export function service<T>(service: ServiceFactory<T>, scopable: object): T;
export function service<T>(factory: ServiceFactory<T>, scopable: object): T {
  const scope = getScope(scopable);

  assert(
    'The second argument passed to `service()` does not have a valid scope. ' +
      'Did you forget to call `setOwner()` or `setScope()`?',
    scope !== undefined,
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
