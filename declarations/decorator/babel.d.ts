type ClassPropertyDescriptor = PropertyDescriptor & {
    initializer?: () => (...args: unknown[]) => unknown;
};
type ClassPropertyDecorator = (target: object, name: string | symbol, descriptor: ClassPropertyDescriptor) => ClassPropertyDescriptor | undefined;
export type DecoratorArgs = Parameters<ClassPropertyDecorator>;
export declare function detect(args: unknown[]): args is DecoratorArgs;
export type ServiceDecorator<T> = ClassPropertyDecorator;
export declare function decoratorFor<T>(service: (scopable: object, name: string | symbol) => T): ServiceDecorator<T>;
export {};
//# sourceMappingURL=babel.d.ts.map