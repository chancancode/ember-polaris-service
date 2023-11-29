import { runInDebug, assert } from '@ember/debug';
import { getScope } from '../scope.js';
import { lookup } from '../primitives.js';
import { detect as detect$1, decoratorFor as decoratorFor$1 } from './babel.js';
import { detect as detect$2, decoratorFor as decoratorFor$2 } from './stage-three.js';

function detect(args) {
  return detect$1(args) || detect$2(args);
}
function decoratorFor(service) {
  function decorator(...args) {
    if (detect$1(args)) {
      return decoratorFor$1(service)(...args);
    } else if (detect$2(args)) {
      return decoratorFor$2(service)(...args);
    }
    runInDebug(() => {
      // Babel class decorator
      if (args.length === 1) {
        const [klass] = args;
        if (typeof klass === 'function' && /^\s*class\s+/.test(klass.toString())) {
          const className = klass.name ? String(klass.name) : 'MyClass';
          let error = `The @service decorator cannot be used on a class.\n`;
          error += `\n`;
          error += `  @service(...) \n`;
          error += `  ~~~~~~~~~~~~~ this is not allowed\n`;
          error += `  class ${className} {\n`;
          error += `    ...\n`;
          error += `  }\n`;
          error += `\n`;
          error += 'Please remove the @service decorator from this class.';
          assert(error);
        }
      }
    });

    // TypeScript experimental decorator support is type-only
    assert('Invalid @service decorator call');
  }
  return decorator;
}
function service(factory) {
  const service = scopable => {
    const scope = getScope(scopable);
    assert('The @service decorator was used on an object without a valid Scope set. ' + 'Did you forget to call `setScope()` or `setOwner()`?', scope !== undefined);
    return lookup(scope, factory);
  };
  return decoratorFor(service);
}

export { decoratorFor, detect, service };
//# sourceMappingURL=index.js.map
