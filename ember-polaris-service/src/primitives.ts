import { assert, runInDebug } from '@ember/debug';
import { type ServiceFactory, instantiate } from './manager.ts';
import { type Scope, mapFor } from './scope.ts';
import { get } from './utils.ts';

export function lookup<T>(scope: Scope, factory: ServiceFactory<T>): T {
  const services = mapFor(scope, Services);
  let service = services.get(factory) as T | undefined;

  if (service === undefined) {
    service = instantiate(scope, factoryFor(scope, factory));
    services.set(factory, service);
  }

  return service;
}

export function override<T>(
  scope: Scope,
  factory: ServiceFactory<T>,
  override: ServiceFactory<T>,
): void {
  runInDebug(() => {
    const services = mapFor(scope, Services);

    if (services.has(factory)) {
      let label: string;

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

function factoryFor<T>(
  scope: Scope,
  factory: ServiceFactory<T>,
): ServiceFactory<T> {
  const overrides = mapFor(scope, Overrides);
  return (overrides.get(factory) ?? factory) as ServiceFactory<T>;
}

type InstantiatedServices = WeakMap<ServiceFactory<unknown>, unknown>;

type OverriddenServices = WeakMap<
  ServiceFactory<unknown>,
  ServiceFactory<unknown>
>;

const Services = new WeakMap<Scope, InstantiatedServices>();

const Overrides = new WeakMap<Scope, OverriddenServices>();
