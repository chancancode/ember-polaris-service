import { assert } from '@ember/debug';
import { LinkTo } from '@ember/routing';
import { cached } from '@glimmer/tracking';
import Route from 'ember-polaris-routing/route';
import CompatRoute from 'ember-polaris-routing/route/compat';
import { type Task, run } from 'ember-tasks';

export interface MetarParams {
  station: string;
}

export class MetarRoute extends Route<MetarParams> {
  get station(): string {
    return this.params.station;
  }

  get url(): string {
    const station = encodeURIComponent(this.station);
    const api = `https://aviationweather.gov/api/data/metar?ids=${station}&format=json`;
    return `https://corsproxy.io/?${encodeURIComponent(api)}`;
  }

  @cached get observation(): Task<string> {
    const url = this.url;

    return run(async function* () {
      const response = await fetch(url);
      yield;

      const data: unknown = await response.json();
      assert('expecting data to be an array', Array.isArray(data));
      assert('expecting data to have one element', data.length === 1);
      yield;

      const item: unknown = data[0];
      assert(
        'expecting item to be an object',
        item !== null && typeof item === 'object',
      );

      const observation = Reflect.get(item, 'rawOb');
      assert(
        'expecting observation to be a string',
        typeof observation === 'string',
      );

      return observation;
    });
  }

  <template>
    <h1>{{this.station}}</h1>

    {{#if this.observation.pending}}
      <p>Loading...</p>
    {{else if this.observation.resolved}}
      <p>{{this.observation.value}}</p>
    {{else}}
      <p>Oops, we ran into an issue!</p>
    {{/if}}

    <ul>
      <li><LinkTo @route='metar' @model='KPDX'>KPDX</LinkTo></li>
      <li><LinkTo @route='metar' @model='KCLS'>KCLS</LinkTo></li>
      <li><LinkTo @route='metar' @model='KOLM'>KOLM</LinkTo></li>
    </ul>
  </template>
}

export default CompatRoute(MetarRoute);
