export interface Scope {
}
export declare function setScope(object: object, scope: Scope): void;
export declare function getScope(object: object): Scope | undefined;
export declare function mapFor<K extends object, V>(scope: Scope, maps: WeakMap<Scope, WeakMap<K, V>>): WeakMap<K, V>;
//# sourceMappingURL=scope.d.ts.map