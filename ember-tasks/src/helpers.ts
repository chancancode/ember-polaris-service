import { assert } from '@ember/debug';
import { type Task } from './task.ts';
import AbortedTask from './aborted.ts';
import PromiseTask from './promise.ts';
import RejectedTask from './rejected.ts';
import ResolvedTask from './resolved.ts';
import RunnableTask, { type RunnableFunction } from './runnable.ts';
import * as AS from './abort-signal.ts';
import PendingTask from './pending.ts';

export function pending<T>(): Task<T> {
  return new PendingTask() as Task<T>;
}

export function resolve<T>(value: T): Task<T> {
  return new ResolvedTask(value) as Task<T>;
}

export function reject<T>(error: unknown): Task<T> {
  return new RejectedTask(error) as Task<T>;
}

export function abort<T>(reason?: unknown): Task<T> {
  if (reason === undefined) {
    reason = AS.abort().reason;
  }
  return new AbortedTask(reason) as Task<T>;
}

export function promise<T>(
  promise: Promise<T>,
  options: AbortOptions = {},
): Task<T> {
  const { controller, signal } = processOptions(options);
  return new PromiseTask(promise, controller, signal) as Task<T>;
}

export function run<T>(
  fn: RunnableFunction<T>,
  options: AbortOptions = {},
): Task<T> {
  const { controller, signal } = processOptions(options, true);
  return new RunnableTask(fn, controller, signal) as Task<T>;
}

export type AbortOptions =
  | {
      abortable?: boolean;
      signal?: AbortSignal;
    }
  | {
      controller?: AbortController;
    };

function processOptions(options: AbortOptions): {
  controller: AbortController | undefined;
  signal: AbortSignal | undefined;
};
function processOptions(
  options: AbortOptions,
  signalIsRequired: true,
): {
  controller: AbortController | undefined;
  signal: AbortSignal;
};
function processOptions(
  options: AbortOptions,
  signalIsRequired?: true,
): {
  controller: AbortController | undefined;
  signal: AbortSignal | undefined;
} {
  if ('controller' in options && options.controller !== undefined) {
    assert(
      'Cannot pass both the controller and abortable option',
      !('abortable' in options) || options.abortable === undefined,
    );

    assert(
      'Cannot pass both the controller and signal option',
      !('signal' in options) || options.signal === undefined,
    );

    return {
      controller: options.controller,
      signal: options.controller.signal,
    };
  } else {
    let controller: AbortController | undefined;
    let signal: AbortSignal | undefined;

    if (('abortable' in options && options.abortable) ?? true) {
      controller = new AbortController();
      signal = controller.signal;
    }

    if ('signal' in options && options.signal !== undefined) {
      if (signal === undefined) {
        signal = options.signal;
      } else {
        signal = AS.any([signal, options.signal]);
      }
    }

    if (signalIsRequired && signal === undefined) {
      signal = new AbortController().signal;
    }

    return { controller, signal };
  }
}
