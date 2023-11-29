import { type ServiceDecorator } from './decorator/index.ts';
import { type ServiceFactory } from './manager.ts';
import { type Scope } from './scope.ts';
declare class Service {
    constructor(scope: Scope);
}
type ServiceConstructor<T> = typeof Service & ServiceFactory<T> & {
    new (scope: Scope): T;
};
declare const _default: typeof Service & ServiceFactory<Service>;
export default _default;
export declare function service<S extends ServiceConstructor<unknown>>(scopable: object, factory: S): InstanceType<S>;
export declare function service<T>(scopable: object, factory: ServiceFactory<T>): T;
export declare function service<T>(factory: ServiceFactory<T>): ServiceDecorator<T>;
//# sourceMappingURL=service.d.ts.map