import { runInDebug, assert } from '@ember/debug';
import { decoratorFor as decoratorFor$1 } from './stage-three.js';

function notImplemented() {
  assert('not implemented');
}
function detect(args) {
  if (args.length !== 3) {
    return false;
  }
  const [, name, descriptor] = args;
  if (typeof name !== 'string' && typeof name !== 'symbol') {
    return false;
  }
  return descriptor !== null && typeof descriptor === 'object' && 'configurable' in descriptor && 'enumerable' in descriptor;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

function decoratorFor(service) {
  const stageThreeDecorator = decoratorFor$1(service);
  function decorator(...args) {
    runInDebug(() => {
      const [target, name, descriptor] = args;
      const {
        value,
        get,
        set,
        initializer
      } = descriptor;
      const isStatic = typeof target === 'function' && /^\s*class\s+/.test(target.toString());
      if (typeof value === 'function') {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const method = value;
        stageThreeDecorator(method, {
          kind: 'method',
          name,
          access: {
            get: notImplemented
          },
          static: isStatic,
          private: false,
          addInitializer: notImplemented
        });
        assert('unreachable');
      }
      if (typeof get === 'function') {
        stageThreeDecorator(get, {
          kind: 'getter',
          name,
          access: {
            get: notImplemented
          },
          static: isStatic,
          private: false,
          addInitializer: notImplemented
        });
        assert('unreachable');
      }
      if (typeof set === 'function') {
        stageThreeDecorator(set, {
          kind: 'setter',
          name,
          access: {
            set: notImplemented
          },
          static: isStatic,
          private: false,
          addInitializer: notImplemented
        });
        assert('unreachable');
      }
      if (typeof initializer === 'function') {
        const init = stageThreeDecorator(undefined, {
          kind: 'field',
          name,
          access: {
            get: notImplemented,
            set: notImplemented
          },
          static: isStatic,
          private: false
        });
        init('nope');
        assert('unreachable');
      }
    });
    const [, name, descriptor] = args;
    const access = {
      get: notImplemented,
      set: notImplemented
    };
    const {
      get,
      set
    } = stageThreeDecorator(access, {
      kind: 'accessor',
      name,
      access,
      static: false,
      private: false,
      addInitializer: notImplemented
    });
    const {
      configurable,
      enumerable
    } = descriptor;
    return {
      configurable,
      enumerable,
      get,
      set
    };
  }
  return decorator;
}

export { decoratorFor, detect };
//# sourceMappingURL=babel.js.map
