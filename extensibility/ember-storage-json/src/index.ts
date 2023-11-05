import Service from 'ember-polaris-service';
import type Storage from 'ember-storage';

export type Serialized =
  | string
  | number
  | boolean
  | null
  | SerializedArray
  | SerializedObject;

export interface SerializedObject {
  [key: string]: Serialized;
}

export interface SerializedArray extends Array<Serialized> {}

export type Serializer<T> = (value: T) => SerializedObject;
export type Deserializer<T> = (serialized: SerializedObject) => T;

export default abstract class JSONStorage extends Service {
  abstract storage: Storage;

  async load<T>(id: string, deserializer: Deserializer<T>): Promise<T | null> {
    const encoded = await this.storage.getItem(`json:${id}`);

    if (encoded) {
      const serialized = JSON.parse(encoded);
      return deserializer(serialized);
    } else {
      return null;
    }
  }

  async store<T>(
    id: string,
    value: T,
    serializer: Serializer<T>,
  ): Promise<void> {
    const serialized = serializer(value);
    const encoded = JSON.stringify(serialized);
    await this.storage.putItem(`json:${id}`, encoded);
  }
}
