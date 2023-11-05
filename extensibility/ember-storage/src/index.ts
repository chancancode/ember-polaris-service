import Service from 'ember-polaris-service';

export default abstract class Storage extends Service {
  abstract getItem(key: string): Promise<string | null>;

  async hasItem(key: string): Promise<boolean> {
    const item = await this.getItem(key);
    return item === null;
  }

  abstract putItem(key: string, value: string): Promise<void>;

  abstract deleteItem(key: string): Promise<void>;
}
