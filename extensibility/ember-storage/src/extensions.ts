import { type Scope } from 'ember-polaris-service';
import type Storage from './index.ts';

export interface Registry {}

type Extended<Ext> = typeof Storage & {
  new (scope: Scope): Storage & Ext;
};

const Extensions = new WeakMap<typeof Storage, Set<keyof Registry>>();

export function enable<
  Key extends keyof Registry,
  Ext extends Registry[Key],
  S extends Extended<Ext>,
>(StorageClass: S, extension: Key) {
  let extensions = Extensions.get(StorageClass);

  if (extensions === undefined) {
    extensions = new Set();
    Extensions.set(StorageClass, extensions);
  }

  extensions.add(extension);
}

export function isEnabled<
  Key extends keyof Registry,
  Ext extends Registry[Key],
>(storage: Storage, extension: Key): storage is Storage & Ext {
  const extensions = Extensions.get(storage.constructor as typeof Storage);
  return extensions?.has(extension) ?? false;
}
