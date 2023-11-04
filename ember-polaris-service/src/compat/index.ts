import { getOwner } from '@ember/application';
import { assert, runInDebug } from '@ember/debug';
import type EmberService from '@ember/service';
import CoreService, {
  type ServiceFactory,
  isServiceFactory,
  lookup,
} from '../index.ts';
import {
  type ServiceDecorator,
  decoratorFor,
  service as serviceDecorator,
  detect,
} from '../decorator/index.ts';

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

export function service<T>(factory: ServiceFactory<T>): ServiceDecorator<T>;
export function service<C extends typeof EmberService>(
  factory: C,
  name?: string,
): ServiceDecorator<InstanceType<C>>;
export function service<T>(...args: unknown[]): ServiceDecorator<T> {
  runInDebug(() => {
    if (detect(args)) {
      let error = `The compat @service decorator cannot be used without arguments.\n`;

      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service foo;\n`;
      error += `    ~~~~~~~~ this is not allowed\n`;
      error += `  }\n`;
      error += `\n`;

      error += `Instead, you will need to pass the service factory as an argument:\n`;

      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service(FooService) foo;\n`;
      error += `            ~~~~~~~~~~~~ this argument is required\n`;
      error += `  }\n`;
      error += `\n`;

      assert(error);
    }

    if (args.length === 0 || args.length > 2) {
      let error = `The compat @service decorator must be called with either one or two arguments.\n`;

      error += `\n`;
      error += `  class MyClass {\n`;
      error += `    @service(FooService) foo;\n`;
      error += `            ~~~~~~~~~~~~ a service factory\n`;
      error += `\n`;
      error += `    @service(BarService, "internal/bar") bar;\n`;
      error += `            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ a service factory and a name\n`;
      error += `  }\n`;
      error += `\n`;

      error += `Please verify you are using the decorator correctly.`;

      assert(error);
    }

    if (isServiceFactory(args[0])) {
      if (args[1] !== undefined) {
        let error = `The compat @service decorator is invoked with a valid `;
        error += `ServiceFactory *and* a string name. This is unnecessary, `;
        error += `because it will be looked up based on its value.\n`;

        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    @service(FooService, "foo") bar;\n`;
        error += `                         ~~~~~ this argument is unnecessary\n`;
        error += `  }\n`;
        error += `\n`;

        error += `Please remove this extraneous string argument.`;

        assert(error);
      }
    } else {
      const MaybeServiceClass = args[0] as
        | typeof EmberService
        | null
        | undefined;

      const isEmberServiceFactory =
        typeof MaybeServiceClass === 'function' &&
        MaybeServiceClass.isServiceFactory;

      if (!isEmberServiceFactory) {
        let error = `The argument passed to the compat @service decorator must `;
        error += `be either a valid ServiceFactory or classic Ember Service `;
        error += `class, but it was neither.\n`;

        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    @service(FooService) foo;\n`;
        error += `            ~~~~~~~~~~~~ this argument is invalid\n`;
        error += `  }\n`;
        error += `\n`;

        error += `Please verify you are using the decorator correctly.`;

        assert(error);
      }
    }
  });

  const [factory, serviceName] = args as
    | [ServiceFactory<T>]
    | [typeof EmberService, string | undefined];

  if (isServiceFactory<T>(factory)) {
    return serviceDecorator(factory);
  } else {
    const service = (scopable: object, propertyName: string | symbol): T => {
      const name = serviceName ?? propertyName;

      assert(
        `The compat @service decorator was used on an unsupported field ` +
          `${String(name)}. The decorator can only be used on string fields.`,
        typeof name !== 'symbol',
      );

      const owner = getOwner(scopable);

      assert(
        `The compat @service decorator was used on an object without an owner.` +
          ' Did you forget to call `setOwner()`?',
        owner !== undefined,
      );

      const result = owner.lookup(`service:${name}`) as T;

      assert(
        `The compat @service decorator was used to lookup \`service:${name}\` ` +
          'but it cannot found. Did you name the field correctly?',
        result !== undefined,
      );

      return result;
    };

    return decoratorFor(service);
  }
}
