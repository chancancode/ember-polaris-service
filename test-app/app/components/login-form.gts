import { Input } from '@ember/component';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from 'ember-polaris-service';
import SessionService from 'test-app/services/session';

export default class LoginForm extends Component {
  session = service(this, SessionService);

  @tracked name: string = '';

  @action submit(event: SubmitEvent): void {
    event.preventDefault();
    this.session.login({ name: this.name });
  }

  <template>
    <p>Please login</p>

    <form {{on 'submit' this.submit}}>
      <label>
        Name
        <Input @value={{this.name}} />
      </label>

      <button type='submit'>Login</button>
    </form>
  </template>
}

/* hack */
on;
Input;

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    LoginForm: typeof LoginForm;
  }
}
