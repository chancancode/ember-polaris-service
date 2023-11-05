import {
  type ServiceFactory,
  provide,
  service,
  singleton,
} from 'ember-polaris-service';
import Storage from 'ember-storage';
import { enable } from 'ember-storage/extensions';
import { type StorageWithBatching } from 'ember-storage-batch';

export class AppStorage extends Storage implements StorageWithBatching {
  #storage = service(this, singleton(localStorage));

  async getItem(key: string): Promise<string | null> {
    return this.getItemSync(key);
  }

  async putItem(key: string, value: string): Promise<void> {
    this.putItemSync(key, value);
  }

  async deleteItem(key: string): Promise<void> {
    this.deleteItemSync(key);
  }

  // StorageWithBatching
  async batchGet(keys: string[]): Promise<(string | null)[]> {
    return keys.map((key) => this.getItemSync(key));
  }

  async batchUpdate(
    items: [key: string, value: string | null][],
  ): Promise<void> {
    for (const [key, value] of items) {
      if (value === null) {
        this.deleteItemSync(key);
      } else {
        this.putItemSync(key, value);
      }
    }
  }

  // Custom Extensions
  getItemSync(key: string): string | null {
    return this.#storage.getItem(this.keyFor(key));
  }

  hasItemSync(key: string): boolean {
    return this.getItemSync(key) !== null;
  }

  putItemSync(key: string, value: string): void {
    this.#storage.setItem(this.keyFor(key), value);
  }

  deleteItemSync(key: string): void {
    this.#storage.removeItem(this.keyFor(key));
  }

  *entries(): Generator<[string, string], void, void> {
    for (let i = 0; i < this.#storage.length; i++) {
      const keyWithPrefix = this.#storage.key(i);

      if (keyWithPrefix?.startsWith(`storage:`)) {
        const key = keyWithPrefix.slice(`storage:`.length);
        const value = this.#storage.getItem(keyWithPrefix);

        if (value !== null) {
          yield [key, value];
        }
      }
    }
  }

  clear(): void {
    this.#storage.clear();
  }

  private keyFor(key: string): string {
    return `storage:${key}`;
  }
}

// This is type safe!
// Even if you didn't write `implements StorageWithBatching` above,
// you will still get an error here.
enable(AppStorage, 'batch');

// We must export the original well-known token! `provide` returns that.
//
// The `as ServiceFactory<AppStorage>` here makes other parts of the app
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
export default provide(Storage, AppStorage) as ServiceFactory<AppStorage>;
