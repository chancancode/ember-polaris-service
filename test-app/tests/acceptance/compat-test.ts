import { setOwner } from '@ember/application';
import type Owner from '@ember/owner';
import { inject } from '@ember/service';
import { module, test } from 'qunit';
import { lookup, service as __service__ } from 'ember-polaris-service';
import Service, { service } from 'ember-polaris-service/compat';
import { setupTest } from 'test-app/tests/helpers';
import ConsoleService from 'test-app/services/console';
import CompatService from 'test-app/services/compat';
import LegacyService from 'test-app/services/legacy';

module('Acceptance | compat', function (hooks) {
  setupTest(hooks);

  test('non-compat services does not work with owner.lookup', async function (assert) {
    assert.throws(
      () => this.owner.lookup('service:console'),
      /Failed to create an instance of 'service:console'/,
    );
  });

  test('non-compat services does not work with @service', async function (assert) {
    class MyClass {
      @inject declare console: unknown;

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
      @inject declare compat: CompatService;

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

  test('@service without arguments', function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service foo;
      }
    }, /The compat @service decorator cannot be used without arguments/);
  });

  test('@service with too many arguments', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service(1, 2, 3) foo;
      }
    }, /The compat @service decorator must be called with either one or two arguments/);
  });

  test('@service with a factory and a name', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service(CompatService, 'compat') compat;
      }
    }, /The compat @service decorator is invoked with a valid ServiceFactory \*and\* a string name/);
  });

  test('@service with an invalid factory', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service({ invalid: true }) compat;
      }
    }, /The argument passed to the compat @service decorator must be either a valid ServiceFactory or classic Ember Service class/);
  });

  test('@service on a class', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      @service
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {}
    }, /The argument passed to the compat @service decorator must be either a valid ServiceFactory or classic Ember Service class/);
  });

  test('@service on a service class', async function (assert) {
    // Unfortunately on Babel legacy decorators we cannot error here
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    @service
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class MyClass extends Service {}

    // At least we'll have this
    assert.throws(() => {
      new MyClass({});
    }, /Invalid @service decorator call/);
  });

  test('@service on a class with arg', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      @service(ConsoleService)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {}
    }, /The @service decorator cannot be used on a class/);
  });

  test('@service on a method', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) foo() {
          throw new Error('unreachable');
        }
      }
    }, /The @service decorator cannot be used on a method/);
  });

  test('@service on a static method', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) static foo() {
          throw new Error('unreachable');
        }
      }
    }, /The @service decorator cannot be used on a static method/);
  });

  test('@service on a getter', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) get foo() {
          throw new Error('unreachable');
        }
      }
    }, /The @service decorator cannot be used on a getter/);
  });

  test('@service on a static getter', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) static get foo() {
          throw new Error('unreachable');
        }
      }
    }, /The @service decorator cannot be used on a static getter/);
  });

  test('@service on a setter', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) set foo(value: unknown) {
          throw new Error('unreachable');
        }
      }
    }, /The @service decorator cannot be used on a setter/);
  });

  test('@service on a static setter', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) static set foo(value: unknown) {
          throw new Error('unreachable');
        }
      }
    }, /The @service decorator cannot be used on a static setter/);
  });

  test('@service on a field with initializer', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) foo = null;
      }
    }, /The @service decorator cannot be used on a field with an initializer/);
  });

  test('@service on a static field', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        @service(ConsoleService) static foo: unknown;
      }
    }, /The @service decorator cannot be used on a static field/);
  });

  test('@service on a field', async function (assert) {
    class MyClass {
      @service(ConsoleService) declare foo: ConsoleService;
    }

    const instance = new MyClass();

    setOwner(instance, this.owner);

    assert.strictEqual(
      typeof instance.foo.warn,
      'function',
      'foo is a ConsoleService',
    );

    assert.strictEqual(
      instance.foo,
      __service__(instance, ConsoleService),
      '@service return the same result as service()',
    );
  });

  test('@service with a compat service', async function (assert) {
    class MyClass {
      @service(CompatService) declare foo: CompatService;
    }

    const instance = new MyClass();

    setOwner(instance, this.owner);

    assert.true(instance.foo.isCompatibleWithClassic, 'foo is a CompatService');

    assert.strictEqual(
      instance.foo,
      __service__(instance, CompatService),
      '@service return the same result as service()',
    );
  });

  test('@service with a legacy service', async function (assert) {
    class MyClass {
      @service(LegacyService) declare legacy: LegacyService;
    }

    const instance = new MyClass();

    setOwner(instance, this.owner);

    assert.true(instance.legacy.isLegacyService, 'legacy is a LegacyService');

    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      __service__(instance, LegacyService);
    }, /The second argument passed to service\(\.\.\.\) is not a valid ServiceFactory/);
  });

  test('@service with a legacy service on the wrong field', async function (assert) {
    class MyClass {
      @service(LegacyService) declare foo: LegacyService;
    }

    const instance = new MyClass();

    setOwner(instance, this.owner);

    assert.throws(
      () => instance.foo,
      /The compat @service decorator was used to lookup `service:foo` but it cannot found/,
    );
  });

  test('@service with a legacy service and explicit name', async function (assert) {
    class MyClass {
      @service(LegacyService, 'legacy') declare foo: LegacyService;
    }

    const instance = new MyClass();

    setOwner(instance, this.owner);

    assert.true(instance.foo.isLegacyService, 'foo is a LegacyService');

    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      __service__(instance, LegacyService);
    }, /The second argument passed to service\(\.\.\.\) is not a valid ServiceFactory/);
  });

  test('@service with a ServiceFactory but without an owner', async function (assert) {
    class MyClass {
      @service(ConsoleService) declare foo: ConsoleService;
    }

    const instance = new MyClass();

    assert.throws(
      () => instance.foo,
      /The @service decorator was used on an object without a valid Scope set/,
    );
  });

  test('@service with a legacy service but without an owner', async function (assert) {
    class MyClass {
      @service(LegacyService) declare legacy: LegacyService;
    }

    const instance = new MyClass();

    assert.throws(
      () => instance.legacy,
      /The compat @service decorator was used on an object without an owner/,
    );
  });
});
