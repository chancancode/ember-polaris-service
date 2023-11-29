import { type ServiceFactory } from './manager.ts';
import { type Scope } from './scope.ts';
export declare function lookup<T>(scope: Scope, factory: ServiceFactory<T>): T;
export declare function override<T>(scope: Scope, factory: ServiceFactory<T>, override: ServiceFactory<T>): void;
//# sourceMappingURL=primitives.d.ts.map