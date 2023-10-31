import { registerDestructor } from '@ember/destroyable';
import Service, { type Scope } from 'ember-polaris-service';

let alreadyInstantiated = false;

export default class ConsoleService extends Service {
  constructor(scope: Scope) {
    super(scope);

    if (alreadyInstantiated) {
      throw new Error('Multiple instances of SessionService created!');
    } else {
      alreadyInstantiated = true;
      registerDestructor(this, () => (alreadyInstantiated = false));
    }
  }

  warn(message: string): void {
    console.warn(message);
  }
}
