import { getOwner } from '@ember/application';
import { get } from './utils.ts';

export interface Scope {}

const SCOPE = Symbol('service:scope');

export function setScope(object: object, scope: Scope): void {
  Object.defineProperty(object, SCOPE, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: scope,
  });
}

export function getScope(object: object): Scope | undefined {
  return get(object, SCOPE) ?? getOwner(object);
}

export function mapFor<K extends object, V>(
  scope: Scope,
  maps: WeakMap<Scope, WeakMap<K, V>>,
): WeakMap<K, V> {
  let map = maps.get(scope);

  if (map === undefined) {
    map = new WeakMap();
    maps.set(scope, map);
  }

  return map;
}
