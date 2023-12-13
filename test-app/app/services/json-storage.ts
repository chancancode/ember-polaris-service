import { type ServiceFactory, provide, service } from 'ember-polaris-service';
import JSONStorage, { type Deserializer } from 'ember-storage-json';
import Storage from './storage';

export class AppJSONStorage extends JSONStorage {
  storage = service(this, Storage);

  // This shows that we can access the app extensions here
  // Note the usage of `this.storage.entries` is type safe!
  async loadAll<T>(
    prefix: string,
    deserializer: Deserializer<T>,
  ): Promise<T[]> {
    prefix = `json:${prefix}`;

    const found: T[] = [];

    for (const [key, value] of this.storage.entries()) {
      if (key.startsWith(prefix)) {
        found.push(deserializer(JSON.parse(value)));
      }
    }

    return found;
  }
}

// We must export the original well-known token! `provide` returns that.
//
// The `as ServiceFactory<AppJSONStorage>` here makes other parts of the app
// automatically.
//
// The type signature in `provide` is intended to make this just work without
// the type cast, and it does work for factory functions and stuff. So e.g.
// `provide(singleton(localStorage), factory(() => extendedStorage)) actually
// does work the way you expect.
//
// However, because of how classes work in TypesScript, all subclasses of
// Service are just considered `ServiceFactory<Service>`. The overload in
// `service` (the function in `service.ts`) is what actually make things
// work.
//
// We can add a similar overload for the primitives too, but I can't do that
// easily right now for circular dependencies reason.
export default provide(
  JSONStorage,
  AppJSONStorage,
) as ServiceFactory<AppJSONStorage>;
