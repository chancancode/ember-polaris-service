import { type ServiceFactory, service } from 'ember-polaris-service';
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

// We must export the original well-known token!
// The `as ServiceFactory<AppJSONStorage>` here makes other parts of the app
// automatically
export default JSONStorage as ServiceFactory<unknown> as ServiceFactory<AppJSONStorage>;
