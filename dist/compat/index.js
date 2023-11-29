import { getOwner } from '@ember/application';
import { assert, runInDebug } from '@ember/debug';
import { isServiceFactory } from '../manager.js';
import { lookup } from '../primitives.js';
import '@ember/destroyable';
import '../singleton.js';
import CoreService from '../service.js';
import { detect, service as service$1, decoratorFor } from '../decorator/index.js';

function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}

class Service extends CoreService {
  static create(props) {
    const owner = getOwner(props);
    assert(`${this.name}.create() was called with an owner`, owner !== undefined);
    return lookup(owner, this);
  }
}
_defineProperty(Service, "isServiceFactory", true);
function service(...args) {
  runInDebug(() => {
    if (detect(args)) {
      let error = `The compat @service decorator cannot be used without arguments.\n`;
      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service foo;\n`;
      error += `    ~~~~~~~~ this is not allowed\n`;
      error += `  }\n`;
      error += `\n`;
      error += `Instead, you will need to pass the service factory as an argument:\n`;
      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service(FooService) foo;\n`;
      error += `            ~~~~~~~~~~~~ this argument is required\n`;
      error += `  }\n`;
      error += `\n`;
      assert(error);
    }
    if (args.length === 0 || args.length > 2) {
      let error = `The compat @service decorator must be called with either one or two arguments.\n`;
      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service(FooService) foo;\n`;
      error += `            ~~~~~~~~~~~~ a service factory\n`;
      error += `\n`;
      error += `    @service(BarService, "internal/bar") bar;\n`;
      error += `            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ a service factory and a name\n`;
      error += `  }\n`;
      error += `\n`;
      error += `Please verify you are using the decorator correctly.`;
      assert(error);
    }
    if (isServiceFactory(args[0])) {
      if (args[1] !== undefined) {
        let error = `The compat @service decorator is invoked with a valid `;
        error += `ServiceFactory *and* a string name. This is unnecessary, `;
        error += `because it will be looked up based on its value.\n`;
        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    @service(FooService, "foo") bar;\n`;
        error += `                         ~~~~~ this argument is unnecessary\n`;
        error += `  }\n`;
        error += `\n`;
        error += `Please remove this extraneous string argument.`;
        assert(error);
      }
    } else {
      const MaybeServiceClass = args[0];
      const isEmberServiceFactory = typeof MaybeServiceClass === 'function' && MaybeServiceClass.isServiceFactory;
      if (!isEmberServiceFactory) {
        let error = `The argument passed to the compat @service decorator must `;
        error += `be either a valid ServiceFactory or classic Ember Service `;
        error += `class, but it was neither.\n`;
        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    @service(FooService) foo;\n`;
        error += `            ~~~~~~~~~~~~ this argument is invalid\n`;
        error += `  }\n`;
        error += `\n`;
        error += `Please verify you are using the decorator correctly.`;
        assert(error);
      }
    }
  });
  const [factory, serviceName] = args;
  if (isServiceFactory(factory)) {
    return service$1(factory);
  } else {
    const service = (scopable, propertyName) => {
      const name = serviceName ?? propertyName;
      assert(`The compat @service decorator was used on an unsupported field ` + `${String(name)}. The decorator can only be used on string fields.`, typeof name !== 'symbol');
      const owner = getOwner(scopable);
      assert(`The compat @service decorator was used on an object without an owner.` + ' Did you forget to call `setOwner()`?', owner !== undefined);
      const result = owner.lookup(`service:${name}`);
      assert(`The compat @service decorator was used to lookup \`service:${name}\` ` + 'but it cannot found. Did you name the field correctly?', result !== undefined);
      return result;
    };
    return decoratorFor(service);
  }
}

export { Service as default, service };
//# sourceMappingURL=index.js.map
