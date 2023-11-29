import type EmberService from '@ember/service';
import CoreService, { type ServiceFactory } from '../index.ts';
import { type ServiceDecorator } from '../decorator/index.ts';
export default class Service extends CoreService {
    static readonly isServiceFactory = true;
    static create(props: object): {};
}
export declare function service<T>(factory: ServiceFactory<T>): ServiceDecorator<T>;
export declare function service<C extends typeof EmberService>(factory: C, name?: string): ServiceDecorator<InstanceType<C>>;
//# sourceMappingURL=index.d.ts.map