import { module, test } from 'qunit';
import { action } from '@ember/object';
import { click, fillIn, visit } from '@ember/test-helpers';
import { override } from 'ember-polaris-service';
import { setupApplicationTest } from 'test-app/tests/helpers';
import ConsoleService from 'test-app/services/console';
import SessionService from 'test-app/services/session';

module('Acceptance | session', function (hooks) {
  setupApplicationTest(hooks);

  test('no overrides', async function (assert) {
    await visit('/');

    assert.dom().containsText('Please login');

    await fillIn('input', 'Godfrey');
    await click('button');

    assert.dom().containsText('Hello, Godfrey!');

    await click('button');

    assert.dom().containsText('Hello, Godfrey!');
  });

  test('overriding ConsoleService', async function (assert) {
    const warnings: string[] = [];

    class MockConsoleService extends ConsoleService {
      warn(message: string) {
        warnings.push(message);
      }
    }

    override(this.owner, ConsoleService, MockConsoleService);

    await visit('/');

    assert.dom().containsText('Please login');

    await fillIn('input', 'Godfrey');
    await click('button');

    assert.dom().containsText('Hello, Godfrey!');

    assert.deepEqual(warnings, []);

    await click('button');

    assert.dom().containsText('Hello, Godfrey!');
    assert.deepEqual(warnings, ['this would have refreshed the page!']);
  });

  test('overriding SessionService', async function (assert) {
    class MockSessionService extends SessionService {
      @action logout(): void {
        this.currentUser = null;
      }
    }

    override(this.owner, SessionService, MockSessionService);

    await visit('/');

    assert.dom().containsText('Please login');

    await fillIn('input', 'Godfrey');
    await click('button');

    assert.dom().containsText('Hello, Godfrey!');

    await click('button');

    assert.dom().containsText('Please login');
  });
});
