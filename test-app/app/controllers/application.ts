import Controller from '@ember/controller';
import { service } from 'ember-polaris-service';
import SessionService from 'test-app/services/session';

export default class ApplicationController extends Controller {
  session = service(this, SessionService);
}
