import { assert, runInDebug } from '@ember/debug';
import {
  type ServiceFactory,
  type ServiceInstanceType,
  instantiate,
  isServiceFactory,
} from './manager.ts';
import { type Scope, mapFor } from './scope.ts';
import { get } from './utils.ts';

export function lookup<T>(scope: Scope, factory: ServiceFactory<T>): T {
  assert(
    'The second argument passed to `lookup()` is not a valid ServiceFactory.',
    isServiceFactory(factory),
  );

  const services = mapFor(scope, Services);
  let service = services.get(factory) as T | undefined;

  if (service === undefined) {
    service = instantiate(scope, factoryFor(scope, factory));
    services.set(factory, service);
  }

  return service;
}

export function provide<T1 extends ServiceFactory<unknown>, T2 extends T1>(
  factory: T1,
  provider: T2,
): ServiceFactory<ServiceInstanceType<T2>> {
  Providers.set(factory, provider);
  return factory as ServiceFactory<ServiceInstanceType<T2>>;
}

export function override<T>(
  scope: Scope,
  factory: ServiceFactory<T>,
  override: ServiceFactory<T>,
): void {
  runInDebug(() => {
    assert(
      'The second argument passed to `override()` is not a valid ServiceFactory.',
      isServiceFactory(factory),
    );

    assert(
      'The third argument passed to `override()` is not a valid ServiceFactory.',
      isServiceFactory(override),
    );

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

  return (overrides.get(factory) ??
    Providers.get(factory) ??
    factory) as ServiceFactory<T>;
}

type InstantiatedServices = WeakMap<ServiceFactory<unknown>, unknown>;

type OverriddenServices = WeakMap<
  ServiceFactory<unknown>,
  ServiceFactory<unknown>
>;

const Services = new WeakMap<Scope, InstantiatedServices>();

const Providers: OverriddenServices = new WeakMap();

const Overrides = new WeakMap<Scope, OverriddenServices>();
