import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import { get } from './utils.js';

const SCOPE = Symbol('service:scope');
function setScope(object, scope) {
  assert('`setScope()` has already been called on this object previously', Object.getOwnPropertyDescriptor(object, SCOPE) === undefined);
  Object.defineProperty(object, SCOPE, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: scope
  });
}
function getScope(object) {
  return get(object, SCOPE) ?? getOwner(object);
}
function mapFor(scope, maps) {
  let map = maps.get(scope);
  if (map === undefined) {
    map = new WeakMap();
    maps.set(scope, map);
  }
  return map;
}

export { getScope, mapFor, setScope };
//# sourceMappingURL=scope.js.map
