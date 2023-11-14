import { getOwner, setOwner } from '@ember/application';
import {
  capabilities,
  setComponentManager,
  getComponentTemplate,
  setComponentTemplate,
} from '@ember/component';
import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
import type Router from '../router/index.ts';
import { type Params } from './params.ts';
import type { Context } from '@glint/template/-private/integration.d.ts';

export type RouteContext<R> = {
  this: R;
  // eslint-disable-next-line @typescript-eslint/ban-types
  args: {};
  blocks: [];
  element: void;
};

export default class Route<P extends Params<P>> {
  static {
    const RouteComponentManager = {
      capabilities: capabilities('3.13', {
        asyncLifecycleCallbacks: false,
        destructor: false,
        updateHook: false,
      }),

      createComponent<P extends Params<P>>(route: Route<P>): Route<P> {
        assert('Must not be null', route !== null);
        assert('Must be an object', typeof route === 'object');
        assert('Must be an instance of Route', #route in route);
        return route;
      },

      getContext<P extends Params<P>>(route: Route<P>): Route<P> {
        assert('Must not be null', route !== null);
        assert('Must be an object', typeof route === 'object');
        assert('Must be an instance of Route', #route in route);
        return route;
      },
    };

    setComponentManager(() => RouteComponentManager, this.prototype);
  }

  #route = true;

  declare [Context]: RouteContext<this>;

  constructor(
    protected router: Router,
    protected params: Params<P>,
  ) {
    setOwner(this, getOwner(router)!);
    associateDestroyableChild(router, this);

    if (getComponentTemplate(this) === undefined) {
      const Template = getComponentTemplate(this.constructor);

      if (Template) {
        setComponentTemplate(Template, this.constructor.prototype);
      }
    }
  }
}
