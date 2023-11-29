import { type ServiceFactory } from './manager.ts';
import { type Scope } from './scope.ts';
type Factory<T> = (scope: Scope) => T;
export declare function factory<F extends Factory<unknown>>(f: F): F & ServiceFactory<ReturnType<F>>;
export {};
//# sourceMappingURL=factory.d.ts.map