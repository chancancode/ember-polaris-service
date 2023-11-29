type ClassMethodDecorator = (value: Function, context: {
    kind: 'method';
    name: string | symbol;
    access: {
        get(): unknown;
    };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => Function | void;
type ClassGetterDecorator = (value: Function, context: {
    kind: 'getter';
    name: string | symbol;
    access: {
        get(): unknown;
    };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => Function | void;
type ClassSetterDecorator = (value: Function, context: {
    kind: 'setter';
    name: string | symbol;
    access: {
        set(value: unknown): void;
    };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => Function | void;
type ClassFieldDecorator = (value: undefined, context: {
    kind: 'field';
    name: string | symbol;
    access: {
        get(): unknown;
        set(value: unknown): void;
    };
    static: boolean;
    private: boolean;
}) => (initialValue: unknown) => unknown | void;
type ClassDecorator = (value: Function, context: {
    kind: 'class';
    name: string | undefined;
    addInitializer(initializer: () => void): void;
}) => Function | void;
type ClassAutoAccessorDecorator = (value: {
    get: () => unknown;
    set: (value: unknown) => void;
}, context: {
    kind: 'accessor';
    name: string | symbol;
    access: {
        get(): unknown;
        set(value: unknown): void;
    };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => {
    get?: () => unknown;
    set?: (value: unknown) => void;
    init?: (initialValue: unknown) => unknown;
} | void;
export type Decorator = ClassMethodDecorator | ClassGetterDecorator | ClassSetterDecorator | ClassFieldDecorator | ClassDecorator | ClassAutoAccessorDecorator;
export type DecoratorArgs = Parameters<Decorator>;
export declare function detect(args: unknown[]): args is DecoratorArgs;
type ServiceClassFieldDecoratorArgs<T> = [
    value: undefined,
    context: {
        kind: 'field';
        name: string | symbol;
        access: {
            get(): T;
            set(value: T): void;
        };
        static: boolean;
        private: boolean;
    }
];
type ServiceClassFieldDecoratorReturn<T> = (initialValue: undefined) => T;
type ServiceClassAutoAccessorDecoratorArgs<T> = [
    value: {
        get: () => T;
        set: (value: T) => void;
    },
    context: {
        kind: 'accessor';
        name: string | symbol;
        access: {
            get(): T;
            set(value: T): void;
        };
        static: boolean;
        private: boolean;
        addInitializer(initializer: () => void): void;
    }
];
type ServiceClassAutoAccessorDecoratorReturn<T> = {
    get: () => T;
    set?: (value: T) => void;
    init?: (initialValue: T) => T | void;
};
declare function _decorator<T>(...args: ServiceClassFieldDecoratorArgs<T>): ServiceClassFieldDecoratorReturn<T>;
declare function _decorator<T>(...args: ServiceClassAutoAccessorDecoratorArgs<T>): ServiceClassAutoAccessorDecoratorReturn<T>;
export type ServiceDecorator<T> = typeof _decorator<T>;
export type GeneralizedServiceDecorator<T> = ServiceDecorator<T> & ((...args: DecoratorArgs) => never);
export declare function decoratorFor<T>(service: (scopable: object, name: string | symbol) => T): GeneralizedServiceDecorator<T>;
export {};
//# sourceMappingURL=stage-three.d.ts.map