import { runInDebug, assert } from '@ember/debug';

const Kinds = ['class', 'method', 'getter', 'setter', 'field', 'accessor'];

/* eslint-disable @typescript-eslint/ban-types */

/* eslint-enable @typescript-eslint/ban-types */

function detect(args) {
  if (args.length !== 2) {
    return false;
  }
  const [, context] = args;
  if (context === null || typeof context !== 'object') {
    return false;
  }
  return Kinds.includes(Reflect.get(context, 'kind'));
}
function decoratorFor(service) {
  function decorator(...args) {
    runInDebug(() => {
      const [, context] = args;
      const {
        kind,
        name
      } = context;
      if (kind === 'class') {
        const className = name ? String(name) : 'MyClass';
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
      if (kind === 'method' || kind === 'getter' || kind === 'setter') {
        let signature = '';
        let label = kind;
        let fieldName;
        if (kind === 'method') {
          fieldName = String(name) || 'someMethod';
          signature = `${fieldName}()`;
        } else if (kind === 'getter') {
          fieldName = String(name) || 'someField';
          signature = `get ${fieldName}()`;
        } else if (kind === 'setter') {
          fieldName = String(name) || 'someField';
          signature = `set ${fieldName}(value)`;
        }
        if (context.static) {
          signature = 'static ' + signature;
          label = 'static ' + label;
        }
        let error = `The @service decorator cannot be used on a ${label}.\n`;
        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    @service(...) ${signature} {\n`;
        error += `    ~~~~~~~~~~~~~ this is not allowed\n`;
        error += `      ...\n`;
        error += `    }\n`;
        error += `  }\n`;
        error += `\n`;
        error += `Please remove the @service decorator from this ${label}.`;
        assert(error);
      }
    });
    const [, context] = args;
    assert('unreachable: kind=class', context.kind !== 'class');
    assert('unreachable: kind=method', context.kind !== 'method');
    assert('unreachable: kind=getter', context.kind !== 'getter');
    assert('unreachable: kind=setter', context.kind !== 'setter');
    const {
      kind,
      name,
      static: isStatic
    } = context;
    if (kind === 'accessor') {
      runInDebug(() => {
        if (isStatic) {
          const filedName = String(name) || 'someField';
          let error = `The @service decorator cannot be used on a static accessor field.`;
          error += `\n`;
          error += `  class MyClass {\n`;
          error += `    @service(...) static accessor ${filedName};\n`;
          error += `                  ~~~~~~ this is not allowed\n`;
          error += `  }\n`;
          error += `\n`;
          error += `Please remove the static keyword from this field.`;
          assert(error);
        }
      });
      let value;
      const get = function () {
        if (value === undefined) {
          value = service(this, name);
        }
        return value;
      };
      let set;
      let init;
      runInDebug(() => {
        set = function set() {
          const filedName = String(name) || 'someField';
          let error = String(name) ? `The \`${String(name)}\` accessor field` : `This accessor field`;
          error += ` is readonly. A field decorated by the @service decorator cannot be set.\n`;
          error += `\n`;
          error += `  class MyClass {\n`;
          error += `    @service(...) accessor ${filedName};\n`;
          error += `  }\n`;
          error += `\n`;
          error += `  myInstance.${filedName} = ...;\n`;
          error += `  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ this is not allowed\n`;
          error += `\n`;
          error += `Please remove this assignment.`;
          assert(error);
        };
        init = function init(initialValue) {
          if (initialValue !== undefined) {
            const filedName = name ? String(name) : 'someField';
            let error = `The @service decorator cannot be used on an accessor field with an initializer.`;
            error += `\n`;
            error += `  class MyClass {\n`;
            error += `    @service(...) accessor ${filedName} = ...;\n`;
            error += `                                        ~~~~~ this is not allowed\n`;
            error += `  }\n`;
            error += `\n`;
            error += `Please remove the initializer from this field.`;
            assert(error);
          }
        };
      });
      return {
        get,
        set,
        init
      };
    }
    if (kind === 'field') {
      runInDebug(() => {
        if (isStatic) {
          const filedName = name ? String(name) : 'someField';
          let error = `The @service decorator cannot be used on a static field.`;
          error += `\n`;
          error += `  class MyClass {\n`;
          error += `    @service(...) static ${filedName};\n`;
          error += `                  ~~~~~~ this is not allowed\n`;
          error += `  }\n`;
          error += `\n`;
          error += `Please remove the static keyword from this field.`;
          assert(error);
        }
      });
      return function (initialValue) {
        runInDebug(() => {
          if (initialValue !== undefined) {
            const filedName = name ? String(name) : 'someField';
            const _________ = filedName.replaceAll(/./g, ' ');
            let error = `The @service decorator cannot be used on a field with an initializer.\n`;
            error += `\n`;
            error += `  class MyClass {\n`;
            error += `    @service(...) ${filedName} = ...;\n`;
            error += `                  ${_________} ~~~~~ this is not allowed\n`;
            error += `  }\n`;
            error += `\n`;
            error += `Please remove the initializer from this field.`;
            assert(error);
          }
        });
        return service(this, name);
      };
    }
    assert('unreachable');
  }
  return decorator;
}

export { decoratorFor, detect };
//# sourceMappingURL=stage-three.js.map
