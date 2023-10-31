import { registerDestructor } from '@ember/destroyable';
import { action } from '@ember/object';
import { isTesting, macroCondition } from '@embroider/macros';
import { tracked } from '@glimmer/tracking';
import Service, { type Scope, service } from 'ember-polaris-service';
import ConsoleService from './console';

export interface User {
  name: string;
}

let alreadyInstantiated = false;

export default class SessionService extends Service {
  @tracked currentUser: User | null = null;

  private console = service(ConsoleService, this);

  constructor(scope: Scope) {
    super(scope);

    if (alreadyInstantiated) {
      throw new Error('Multiple instances of SessionService created!');
    } else {
      alreadyInstantiated = true;
      registerDestructor(this, () => (alreadyInstantiated = false));
    }
  }

  get name() {
    return this.currentUser?.name ?? 'Guest';
  }

  get isLoggedIn() {
    return this.currentUser === null;
  }

  @action login(user: User): void {
    this.currentUser = user;
  }

  @action logout(): void {
    if (macroCondition(isTesting())) {
      this.console.warn('this would have refreshed the page!');
    } else {
      window.location.href = '/';
    }
  }
}
