import { type Scope } from './scope.ts';
declare const INSTANTIATE: unique symbol;
export interface ServiceFactory<T> {
    [INSTANTIATE]: (scope: Scope) => T;
}
export interface ServiceManager<D extends object, T> {
    createService(definition: D): T;
}
export interface ServiceManagerFactory<D extends object, T> {
    (scope: Scope): ServiceManager<D, T>;
}
export declare function setServiceManager<D extends object, T>(factory: ServiceManagerFactory<D, T>, definition: D): D & ServiceFactory<T>;
export declare function isServiceFactory<T = unknown>(factory: unknown): factory is ServiceFactory<T>;
export declare function instantiate<T>(scope: Scope, factory: ServiceFactory<T>): T;
export {};
//# sourceMappingURL=manager.d.ts.map