import { type ServiceFactory } from '../manager.ts';
import { type DecoratorArgs as BabelDecoratorArgs, type ServiceDecorator as BabelServiceDecorator } from './babel.ts';
import { type DecoratorArgs as StageThreeDecoratorArgs, type ServiceDecorator as StageThreeServiceDecorator } from './stage-three.ts';
import { type ServiceDecorator as TypeScriptServiceDecorator } from './typescript.ts';
export type DecoratorArgs = BabelDecoratorArgs | StageThreeDecoratorArgs;
export declare function detect(args: unknown[]): args is DecoratorArgs;
declare function _decorator<T>(...args: Parameters<BabelServiceDecorator<T>>): ReturnType<BabelServiceDecorator<T>>;
declare function _decorator<T>(...args: Parameters<StageThreeServiceDecorator<T>>): ReturnType<StageThreeServiceDecorator<T>>;
declare function _decorator<T>(...args: Parameters<TypeScriptServiceDecorator<T>>): ReturnType<TypeScriptServiceDecorator<T>>;
export type ServiceDecorator<T> = typeof _decorator<T>;
export declare function decoratorFor<T>(service: (scopable: object, name: string | symbol) => T): ServiceDecorator<T>;
export declare function service<T>(factory: ServiceFactory<T>): ServiceDecorator<T>;
export {};
//# sourceMappingURL=index.d.ts.map