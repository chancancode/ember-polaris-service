import { module, test } from 'qunit';
import {
  type Scope,
  override,
  service,
  setScope,
  singleton,
} from 'ember-polaris-service';
import { setupTest } from 'test-app/tests/helpers';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

class Owned {
  constructor(scope: Scope) {
    setScope(this, scope);
  }
}

class Test extends Owned {
  now = service(this, singleton(Date.now));
}

module('Acceptance | singletons', function (hooks) {
  setupTest(hooks);

  test('no overrides', async function (assert) {
    const test = new Test(this.owner);

    const t1 = test.now();
    assert.strictEqual(typeof t1, 'number');

    await sleep(10);

    const t2 = test.now();
    assert.strictEqual(typeof t2, 'number');

    assert.ok(t2 > t1, 't2 > t1');
    assert.ok(t2 - t1 >= 10, 't2 - t1 >= 10');
  });

  test('overriding Date.now', async function (assert) {
    const frozen = Date.now();

    override(
      this.owner,
      singleton(Date.now),
      singleton(() => frozen),
    );

    const test = new Test(this.owner);

    const t1 = test.now();
    assert.strictEqual(typeof t1, 'number');
    assert.strictEqual(t1, frozen, 't1 === frozen');

    await sleep(10);

    const t2 = test.now();
    assert.strictEqual(typeof t2, 'number');
    assert.strictEqual(t2, frozen, 't2 === frozen');
  });
});
