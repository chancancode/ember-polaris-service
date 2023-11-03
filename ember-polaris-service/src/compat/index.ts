import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import CoreService, { lookup } from '../index.ts';

export default class Service extends CoreService {
  static readonly isServiceFactory = true;

  static create(props: object) {
    const owner = getOwner(props);

    assert(
      `${this.name}.create() was called with an owner`,
      owner !== undefined,
    );

    return lookup(owner, this);
  }
}
