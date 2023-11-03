import { setOwner } from '@ember/application';
import type Owner from '@ember/owner';
import { service } from '@ember/service';
import { module, test } from 'qunit';
import { lookup } from 'ember-polaris-service';
import { setupTest } from 'test-app/tests/helpers';
import CompatService from 'test-app/services/compat';

module('Acceptance | singletons', function (hooks) {
  setupTest(hooks);

  test('non-compat services does not work with owner.lookup', async function (assert) {
    assert.throws(
      () => this.owner.lookup('service:console'),
      /Failed to create an instance of 'service:console'/,
    );
  });

  test('non-compat services does not work with @service', async function (assert) {
    class MyClass {
      @service declare console: unknown;

      constructor(owner: Owner) {
        setOwner(this, owner);
      }
    }

    assert.throws(
      () => new MyClass(this.owner).console,
      /Failed to create an instance of 'service:console'/,
    );
  });

  test('compat service works with owner.lookup', async function (assert) {
    const compat = this.owner.lookup('service:compat') as unknown as
      | CompatService
      | undefined;

    assert.true(compat?.isCompatibleWithClassic);

    assert.strictEqual(
      compat,
      lookup(this.owner, CompatService),
      'owner.lookup and lookup() must return the same instance',
    );
  });

  test('compat service works with @service', async function (assert) {
    class MyClass {
      @service declare compat: CompatService;

      constructor(owner: Owner) {
        setOwner(this, owner);
      }
    }

    const instance = new MyClass(this.owner);

    assert.true(instance.compat.isCompatibleWithClassic);

    assert.strictEqual(
      instance.compat,
      lookup(this.owner, CompatService),
      '@service and lookup() must return the same instance',
    );
  });
});
