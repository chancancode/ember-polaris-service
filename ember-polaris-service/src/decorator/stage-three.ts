import { assert, runInDebug } from '@ember/debug';

const Kinds = [
  'class',
  'method',
  'getter',
  'setter',
  'field',
  'accessor',
] as const;

/* eslint-disable @typescript-eslint/ban-types */
type ClassMethodDecorator = (
  value: Function,
  context: {
    kind: 'method';
    name: string | symbol;
    access: { get(): unknown };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  },
) => Function | void;

type ClassGetterDecorator = (
  value: Function,
  context: {
    kind: 'getter';
    name: string | symbol;
    access: { get(): unknown };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  },
) => Function | void;

type ClassSetterDecorator = (
  value: Function,
  context: {
    kind: 'setter';
    name: string | symbol;
    access: { set(value: unknown): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  },
) => Function | void;

type ClassFieldDecorator = (
  value: undefined,
  context: {
    kind: 'field';
    name: string | symbol;
    access: { get(): unknown; set(value: unknown): void };
    static: boolean;
    private: boolean;
  },
) => (initialValue: unknown) => unknown | void;

type ClassDecorator = (
  value: Function,
  context: {
    kind: 'class';
    name: string | undefined;
    addInitializer(initializer: () => void): void;
  },
) => Function | void;

type ClassAutoAccessorDecorator = (
  value: {
    get: () => unknown;
    set: (value: unknown) => void;
  },
  context: {
    kind: 'accessor';
    name: string | symbol;
    access: { get(): unknown; set(value: unknown): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  },
) => {
  get?: () => unknown;
  set?: (value: unknown) => void;
  init?: (initialValue: unknown) => unknown;
} | void;
/* eslint-enable @typescript-eslint/ban-types */

export type Decorator =
  | ClassMethodDecorator
  | ClassGetterDecorator
  | ClassSetterDecorator
  | ClassFieldDecorator
  | ClassDecorator
  | ClassAutoAccessorDecorator;

export type DecoratorArgs = Parameters<Decorator>;

export function detect(args: unknown[]): args is DecoratorArgs {
  if (args.length !== 2) {
    return false;
  }

  const [, context] = args;

  if (context === null || typeof context !== 'object') {
    return false;
  }

  return Kinds.includes(Reflect.get(context, 'kind'));
}

type ServiceClassFieldDecoratorArgs<T> = [
  value: undefined,
  context: {
    kind: 'field';
    name: string | symbol;
    access: { get(): T; set(value: T): void };
    static: boolean;
    private: boolean;
  },
];

type ServiceClassFieldDecoratorReturn<T> = (initialValue: undefined) => T;

type ServiceClassFieldDecorator<T> = (
  ...args: ServiceClassFieldDecoratorArgs<T>
) => ServiceClassFieldDecoratorReturn<T>;

type ServiceClassAutoAccessorDecoratorArgs<T> = [
  value: {
    get: () => T;
    set: (value: T) => void;
  },
  context: {
    kind: 'accessor';
    name: string | symbol;
    access: { get(): T; set(value: T): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  },
];

type ServiceClassAutoAccessorDecoratorReturn<T> = {
  get: () => T;
  set?: (value: T) => void;
  init?: (initialValue: T) => T | void;
};

type ServiceClassAutoAccessorDecorator<T> = (
  ...args: ServiceClassAutoAccessorDecoratorArgs<T>
) => ServiceClassAutoAccessorDecoratorReturn<T>;

type ServiceDecoratorArgs<T> =
  | ServiceClassFieldDecoratorArgs<T>
  | ServiceClassAutoAccessorDecoratorArgs<T>;

type ServiceDecoratorReturn<T> =
  | ServiceClassAutoAccessorDecoratorReturn<T>
  | ServiceClassFieldDecoratorReturn<T>;

declare function _decorator<T>(
  ...args: ServiceClassFieldDecoratorArgs<T>
): ServiceClassFieldDecoratorReturn<T>;
declare function _decorator<T>(
  ...args: ServiceClassAutoAccessorDecoratorArgs<T>
): ServiceClassAutoAccessorDecoratorReturn<T>;

export type ServiceDecorator<T> = typeof _decorator<T>;

export type GeneralizedServiceDecorator<T> = ServiceDecorator<T> &
  ((...args: DecoratorArgs) => never);

export function decoratorFor<T>(
  service: (scopable: object, name: string | symbol) => T,
): GeneralizedServiceDecorator<T> {
  function decorator(
    ...args: ServiceClassFieldDecoratorArgs<T>
  ): ServiceClassFieldDecoratorReturn<T>;
  function decorator(
    ...args: ServiceClassAutoAccessorDecoratorArgs<T>
  ): ServiceClassAutoAccessorDecoratorReturn<T>;
  function decorator(...args: DecoratorArgs): never;
  function decorator(
    ...args: DecoratorArgs | ServiceDecoratorArgs<T>
  ): ServiceDecoratorReturn<T> {
    runInDebug(() => {
      const [, context] = args;
      const { kind, name } = context;

      if (kind === 'class') {
        const className = name ? String(name) : 'MyClass';

        let error = `The @service decorator cannot be used on a class.\n`;
        error += `\n`;
        error += `  @service(...) \n`;
        error += `  ~~~~~~~~~~~~~ this is not allowed\n`;
        error += `  class ${className} {\n`;
        error += `    ...\n`;
        error += `  }\n`;
        error += `\n`;

        error += 'Please remove the @service decorator from this class.';

        assert(error);
      }

      if (kind === 'method' || kind === 'getter' || kind === 'setter') {
        let signature = '';
        let label: string = kind;
        let fieldName: string;

        if (kind === 'method') {
          fieldName = String(name) || 'someMethod';
          signature = `${fieldName}()`;
        } else if (kind === 'getter') {
          fieldName = String(name) || 'someField';
          signature = `get ${fieldName}()`;
        } else if (kind === 'setter') {
          fieldName = String(name) || 'someField';
          signature = `set ${fieldName}(value)`;
        }

        if (context.static) {
          signature = 'static ' + signature;
          label = 'static ' + label;
        }

        let error = `The @service decorator cannot be used on a ${label}.\n`;
        error += `\n`;
        error += `  class MyClass {\n`;
        error += `    @service(...) ${signature} {\n`;
        error += `    ~~~~~~~~~~~~~ this is not allowed\n`;
        error += `      ...\n`;
        error += `    }\n`;
        error += `  }\n`;
        error += `\n`;

        error += `Please remove the @service decorator from this ${label}.`;

        assert(error);
      }
    });

    const [, context] = args;

    assert('unreachable: kind=class', context.kind !== 'class');
    assert('unreachable: kind=method', context.kind !== 'method');
    assert('unreachable: kind=getter', context.kind !== 'getter');
    assert('unreachable: kind=setter', context.kind !== 'setter');

    const { kind, name, static: isStatic } = context;

    if (kind === 'accessor') {
      runInDebug(() => {
        if (isStatic) {
          const filedName = String(name) || 'someField';
          let error = `The @service decorator cannot be used on a static accessor field.`;

          error += `\n`;
          error += `  class MyClass {\n`;
          error += `    @service(...) static accessor ${filedName};\n`;
          error += `                  ~~~~~~ this is not allowed\n`;
          error += `  }\n`;
          error += `\n`;

          error += `Please remove the static keyword from this field.`;

          assert(error);
        }
      });

      type NonVoid<T> = T extends void ? never : T;
      type Return = NonVoid<ReturnType<ServiceClassAutoAccessorDecorator<T>>>;

      let value: T | undefined;

      const get = function (this: object) {
        if (value === undefined) {
          value = service(this, name);
        }

        return value;
      } satisfies Return['get'];

      let set: Return['set'] | undefined;
      let init: Return['init'] | undefined;

      runInDebug(() => {
        set = function set(this: object) {
          const filedName = String(name) || 'someField';

          let error = String(name)
            ? `The \`${String(name)}\` accessor field`
            : `This accessor field`;

          error += ` is readonly. A field decorated by the @service decorator cannot be set.\n`;
          error += `\n`;
          error += `  class MyClass {\n`;
          error += `    @service(...) accessor ${filedName};\n`;
          error += `  }\n`;
          error += `\n`;
          error += `  myInstance.${filedName} = ...;\n`;
          error += `  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ this is not allowed\n`;
          error += `\n`;

          error += `Please remove this assignment.`;

          assert(error);
        };

        init = function init(this: object, initialValue: unknown) {
          if (initialValue !== undefined) {
            const filedName = name ? String(name) : 'someField';
            let error = `The @service decorator cannot be used on an accessor field with an initializer.`;

            error += `\n`;
            error += `  class MyClass {\n`;
            error += `    @service(...) accessor ${filedName} = ...;\n`;
            error += `                                        ~~~~~ this is not allowed\n`;
            error += `  }\n`;
            error += `\n`;

            error += `Please remove the initializer from this field.`;

            assert(error);
          }
        };
      });

      return { get, set, init } satisfies Return;
    }

    if (kind === 'field') {
      runInDebug(() => {
        if (isStatic) {
          const filedName = name ? String(name) : 'someField';
          let error = `The @service decorator cannot be used on a static field.`;

          error += `\n`;
          error += `  class MyClass {\n`;
          error += `    @service(...) static ${filedName};\n`;
          error += `                  ~~~~~~ this is not allowed\n`;
          error += `  }\n`;
          error += `\n`;

          error += `Please remove the static keyword from this field.`;

          assert(error);
        }
      });

      return function (this: object, initialValue: unknown) {
        runInDebug(() => {
          if (initialValue !== undefined) {
            const filedName = name ? String(name) : 'someField';
            const _________ = filedName.replaceAll(/./g, ' ');

            let error = `The @service decorator cannot be used on a field with an initializer.\n`;
            error += `\n`;
            error += `  class MyClass {\n`;
            error += `    @service(...) ${filedName} = ...;\n`;
            error += `                  ${_________} ~~~~~ this is not allowed\n`;
            error += `  }\n`;
            error += `\n`;

            error += `Please remove the initializer from this field.`;

            assert(error);
          }
        });

        return service(this, name);
      } satisfies ReturnType<ServiceClassFieldDecorator<T>>;
    }

    assert('unreachable');
  }

  return decorator;
}
