import { setOwner } from '@ember/application';
import { module, test } from 'qunit';
import Service, { service } from 'ember-polaris-service';
import { setupTest } from 'test-app/tests/helpers';
import ConsoleService from 'test-app/services/console';
import CompatService from 'test-app/services/compat';
import LegacyService from 'test-app/services/legacy';

module('Acceptance | decorator', function (hooks) {
  setupTest(hooks);

  test('@service no arguments', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service foo;
      }
    }, /The service function cannot be used directly as a decorator/);
  });

  test('@service with too many arguments', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service(1, 2, 3) foo;
      }
    }, /The service function must be called with either one or two arguments/);
  });

  test('@service an invalid factory', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service(undefined) foo;
      }
    }, /The argument passed to @service\(\.\.\.\) is not a valid ServiceFactory/);
  });

  test('@service on a class', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      @service
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {}
    }, /The argument passed to @service\(\.\.\.\) is not a valid ServiceFactor/);
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
      service(instance, ConsoleService),
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
      service(instance, CompatService),
      '@service return the same result as service()',
    );
  });

  test('@service with a legacy service', async function (assert) {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class MyClass {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        @service(LegacyService) declare legacy: LegacyService;
      }
    }, /The argument passed to @service\(\.\.\.\) is not a valid ServiceFactory/);
  });

  test('@service without a scope', async function (assert) {
    class MyClass {
      @service(ConsoleService) declare foo: ConsoleService;
    }

    const instance = new MyClass();

    assert.throws(
      () => instance.foo,
      /The @service decorator was used on an object without a valid Scope set/,
    );
  });
});
