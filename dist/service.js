import { runInDebug, assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
import { detect, service as service$1 } from './decorator/index.js';
import { lookup } from './primitives.js';
import { setServiceManager, isServiceFactory } from './manager.js';
import { getScope, setScope } from './scope.js';

class Service {
  constructor(scope) {
    setScope(this, scope);
    // Should this be part of `lookup`, in general?
    associateDestroyableChild(scope, this);
  }
}
class ServiceManager {
  constructor(scope) {
    this.scope = scope;
  }
  createService(Service) {
    return new Service(this.scope);
  }
}
var CoreService = setServiceManager(scope => new ServiceManager(scope), Service);

// Is this cheating?

function service(...args) {
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
    assert('unreachable: invalid ServiceFactory', isServiceFactory(factory));
    return service$1(factory);
  }
  if (args.length === 2) {
    assert('unreachable: not an object', args[0] !== null && typeof args[0] === 'object');
    assert('unreachable: invalid ServiceFactory', isServiceFactory(args[1]));
    const [scopable, factory] = args;
    const scope = getScope(scopable);
    assert('unreachable: invalid ServiceFactory', scope !== undefined);
    return lookup(scope, factory);
  }
  assert('unreachable');
}

export { CoreService as default, service };
//# sourceMappingURL=service.js.map
