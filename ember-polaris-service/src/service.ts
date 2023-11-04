import { assert, runInDebug } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
import {
  type ServiceDecorator,
  detect,
  service as serviceDecorator,
} from './decorator/index.ts';
import { lookup } from './primitives.ts';
import {
  type ServiceFactory,
  setServiceManager,
  isServiceFactory,
} from './manager.ts';
import { type Scope, getScope, setScope } from './scope.ts';

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

// Is this cheating?
export function service<S extends ServiceConstructor<unknown>>(
  scopable: object,
  factory: S,
): InstanceType<S>;
export function service<T>(scopable: object, factory: ServiceFactory<T>): T;
export function service<T>(factory: ServiceFactory<T>): ServiceDecorator<T>;
export function service<T>(...args: unknown[]) {
  runInDebug(() => {
    if (detect(args)) {
      let error = `The service function cannot be used directly as a decorator.\n`;

      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service someField;\n`;
      error += `    ~~~~~~~~ this is not allowed\n`;
      error += `  }\n`;
      error += `\n`;

      error += `Instead, you will need to pass the service factory as an argument:\n`;

      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service(MyService) someField;\n`;
      error += `            ~~~~~~~~~~~ this argument is required\n`;
      error += `  }\n`;
      error += `\n`;

      assert(error);
    }

    if (args.length === 0 || args.length > 2) {
      let error = `The service function must be called with either one or two arguments.\n`;

      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service(MyService) someField;\n`;
      error += `            ~~~~~~~~~~~ decorator form: this argument is required\n`;
      error += `\n`;
      error += `    anotherField = service(this, MyService);\n`;
      error += `                          ~~~~~~~~~~~~~~~~~ function form: these arguments are required\n`;
      error += `  }\n`;
      error += `\n`;

      error += `Please verify you are calling the function correctly.`;

      assert(error);
    }

    if (args.length === 1 && !isServiceFactory(args[0])) {
      let error = `The argument passed to @service(...) is not a valid ServiceFactory.\n`;

      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service(MyService) someField;\n`;
      error += `            ~~~~~~~~~~~ this argument must be a ServiceFactory\n`;
      error += `  }\n`;
      error += `\n`;

      error += `Please verify you are calling the function correctly.`;

      assert(error);
    }

    if (args.length === 2) {
      if (args[0] === null || typeof args[0] !== 'object') {
        let error = `The first argument passed to service(...) is not an object.\n`;

        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    someField = service(this, MyService);\n`;
        error += `                        ~~~~ this argument must be an object\n`;
        error += `  }\n`;
        error += `\n`;

        error += `Please verify you are calling the function correctly.`;

        assert(error);
      }

      if (getScope(args[0]) === undefined) {
        let error = `The first argument passed to service(...) does not have a valid Scope.\n`;

        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    someField = service(this, MyService);\n`;
        error += `                        ~~~~ this argument must be attached to a valid Scope\n`;
        error += `  }\n`;
        error += `\n`;

        error += 'Did you forget to call `setScope()` or `setOwner()`?';

        assert(error);
      }

      if (!isServiceFactory(args[1])) {
        let error = `The second argument passed to service(...) is not a valid ServiceFactory.\n`;

        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    someField = service(this, MyService);\n`;
        error += `                              ~~~~~~~~~ this argument must be a ServiceFactory\n`;
        error += `  }\n`;
        error += `\n`;

        error += `Please verify you are calling the function correctly.`;

        assert(error);
      }
    }
  });

  if (args.length === 1) {
    const [factory] = args;
    assert('unreachable: invalid ServiceFactory', isServiceFactory<T>(factory));
    return serviceDecorator<T>(factory);
  }

  if (args.length === 2) {
    assert(
      'unreachable: not an object',
      args[0] !== null && typeof args[0] === 'object',
    );

    assert('unreachable: invalid ServiceFactory', isServiceFactory<T>(args[1]));

    const [scopable, factory] = args;
    const scope = getScope(scopable);

    assert('unreachable: invalid ServiceFactory', scope !== undefined);

    return lookup<T>(scope, factory);
  }

  assert('unreachable');
}
