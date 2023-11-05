import Storage from 'ember-storage';
import { isEnabled } from 'ember-storage/extensions';

declare module 'ember-storage/extensions' {
  export interface Registry {
    batch: StorageWithBatching;
  }
}

export interface StorageWithBatching {
  batchGet(keys: string[]): Promise<Array<string | null>>;
  batchUpdate(items: [key: string, value: string | null][]): Promise<void>;
}

export async function getMany(
  storage: Storage,
  keys: string[],
): Promise<Array<string | null>> {
  if (isEnabled(storage, 'batch')) {
    return storage.batchGet(keys);
  } else {
    const result = new Array<string | null>();

    for (const key of keys) {
      result.push(await storage.getItem(key));
    }

    return result;
  }
}

export async function putMany(
  storage: Storage,
  items: Array<[key: string, value: string]>,
): Promise<void> {
  if (isEnabled(storage, 'batch')) {
    return storage.batchUpdate(items);
  } else {
    for (const [key, value] of items) {
      await storage.putItem(key, value);
    }
  }
}

export async function deleteMany(
  storage: Storage,
  keys: string[],
): Promise<void> {
  if (isEnabled(storage, 'batch')) {
    return storage.batchUpdate(keys.map((key) => [key, null]));
  } else {
    for (const key of keys) {
      await storage.deleteItem(key);
    }
  }
}
