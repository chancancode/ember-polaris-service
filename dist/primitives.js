import { assert, runInDebug } from '@ember/debug';
import { isServiceFactory, instantiate } from './manager.js';
import { mapFor } from './scope.js';
import { get } from './utils.js';

function lookup(scope, factory) {
  assert('The second argument passed to `lookup()` is not a valid ServiceFactory.', isServiceFactory(factory));
  const services = mapFor(scope, Services);
  let service = services.get(factory);
  if (service === undefined) {
    service = instantiate(scope, factoryFor(scope, factory));
    services.set(factory, service);
  }
  return service;
}
function override(scope, factory, override) {
  runInDebug(() => {
    assert('The second argument passed to `override()` is not a valid ServiceFactory.', isServiceFactory(factory));
    assert('The third argument passed to `override()` is not a valid ServiceFactory.', isServiceFactory(override));
    const services = mapFor(scope, Services);
    if (services.has(factory)) {
      let label;
      try {
        const possibleName = get(factory, 'name');
        if (typeof possibleName === 'string') {
          label = possibleName;
        } else {
          label = String(factory);
        }
      } catch {
        label = '(unknown service)';
      }
      assert(`Cannot override ${label} after it has already be instantiated`);
    }
  });
  const overrides = mapFor(scope, Overrides);
  overrides.set(factory, override);
}
function factoryFor(scope, factory) {
  const overrides = mapFor(scope, Overrides);
  return overrides.get(factory) ?? factory;
}
const Services = new WeakMap();
const Overrides = new WeakMap();

export { lookup, override };
//# sourceMappingURL=primitives.js.map
