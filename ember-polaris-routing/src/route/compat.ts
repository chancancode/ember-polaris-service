import ApplicationInstance from '@ember/application/instance';
import { assert } from '@ember/debug';
import ClassicRoute from '@ember/routing/route';
import { precompileTemplate } from '@ember/template-compilation';
import type Route from './index.ts';
import { type Params, TrackedRouteParams } from './params.ts';
import type Router from '../router/index.ts';

type RouteConstructor<P> = {
  new (router: Router, params: Params<P>): Route<Params<P>>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRouteConstructor = RouteConstructor<any>;

type ParamsFor<R> = R extends RouteConstructor<infer P>
  ? P
  : Params<{ [key: string]: never }>;

const TEMPLATE = precompileTemplate(`<@model/>`, {
  strictMode: true,
  scope: () => ({}),
});

// eslint-disable-next-line @typescript-eslint/ban-types
export default function CompatRoute<R extends AnyRouteConstructor>(
  RouteClass: R,
): typeof ClassicRoute<InstanceType<R>> {
  interface RouteState {
    readonly params: TrackedRouteParams<ParamsFor<R>>;
    readonly route: InstanceType<R>;
  }

  return class AdapterRoute extends ClassicRoute<InstanceType<R>> {
    #state: RouteState | null = null;

    readonly templateName = '-ember-polaris-routing';

    constructor(owner?: ConstructorParameters<typeof ClassicRoute>[0]) {
      super(owner);

      if (owner) {
        // TODO: EngineInstance
        assert(
          'owner must be an ApplicationInstance',
          owner instanceof ApplicationInstance,
        );

        if (!owner.hasRegistration('template:-ember-polaris-routing')) {
          owner.register('template:-ember-polaris-routing', TEMPLATE);
        }
      }
    }

    model(params: ParamsFor<R>): InstanceType<R> {
      let state = this.#state;
      if (state === null) {
        const tracked = TrackedRouteParams.from(params);
        const route = new RouteClass(
          this /* FIXME */,
          tracked,
        ) as InstanceType<R>; // TODO: why is this cast necessary?
        state = this.#state = {
          params: tracked,
          route,
        };
      } else {
        TrackedRouteParams.update(state.params, params);
      }
      return state.route;
    }
  };
}
