import { assert, runInDebug } from '@ember/debug';
import { type ServiceFactory } from '../manager.ts';
import { lookup } from '../primitives.ts';
import { getScope } from '../scope.ts';
import {
  type DecoratorArgs as BabelDecoratorArgs,
  type ServiceDecorator as BabelServiceDecorator,
  decoratorFor as decoratorForBabel,
  detect as detectBabel,
} from './babel.ts';
import {
  type DecoratorArgs as StageThreeDecoratorArgs,
  type ServiceDecorator as StageThreeServiceDecorator,
  decoratorFor as decoratorForStageThree,
  detect as detectStageThree,
} from './stage-three.ts';
import {
  type DecoratorArgs as TypeScriptDecoratorArgs,
  type ServiceDecorator as TypeScriptServiceDecorator,
} from './typescript.ts';

export type DecoratorArgs = BabelDecoratorArgs | StageThreeDecoratorArgs;

export function detect(args: unknown[]): args is DecoratorArgs {
  return detectBabel(args) || detectStageThree(args);
}

declare function _decorator<T>(
  ...args: Parameters<BabelServiceDecorator<T>>
): ReturnType<BabelServiceDecorator<T>>;
declare function _decorator<T>(
  ...args: Parameters<StageThreeServiceDecorator<T>>
): ReturnType<StageThreeServiceDecorator<T>>;
declare function _decorator<T>(
  ...args: Parameters<TypeScriptServiceDecorator<T>>
): ReturnType<TypeScriptServiceDecorator<T>>;

export type ServiceDecorator<T> = typeof _decorator<T>;

export function decoratorFor<T>(
  service: (scopable: object, name: string | symbol) => T,
): ServiceDecorator<T> {
  function decorator(
    ...args: BabelDecoratorArgs
  ): ReturnType<BabelServiceDecorator<T>>;
  function decorator(
    ...args: StageThreeDecoratorArgs
  ): ReturnType<StageThreeServiceDecorator<T>>;
  function decorator(
    ...args: TypeScriptDecoratorArgs
  ): ReturnType<TypeScriptServiceDecorator<T>>;
  function decorator(...args: unknown[]) {
    if (detectBabel(args)) {
      return decoratorForBabel(service)(...args);
    } else if (detectStageThree(args)) {
      return decoratorForStageThree(service)(...args);
    }

    runInDebug(() => {
      // Babel class decorator
      if (args.length === 1) {
        const [klass] = args;

        if (
          typeof klass === 'function' &&
          /^\s*class\s+/.test(klass.toString())
        ) {
          const className = klass.name ? String(klass.name) : 'MyClass';

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
      }
    });

    // TypeScript experimental decorator support is type-only
    assert('Invalid @service decorator call');
  }

  return decorator as ServiceDecorator<T>;
}

export function service<T>(factory: ServiceFactory<T>): ServiceDecorator<T> {
  const service = (scopable: object): T => {
    const scope = getScope(scopable);

    assert(
      'The @service decorator was used on an object without a valid Scope set. ' +
        'Did you forget to call `setScope()` or `setOwner()`?',
      scope !== undefined,
    );

    return lookup(scope, factory);
  };

  return decoratorFor(service);
}
