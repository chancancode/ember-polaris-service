export let any: (signals: AbortSignal[]) => AbortSignal;
export let abort: (reason?: unknown) => AbortSignal;

type CompatAbortSignal = Partial<typeof AbortSignal> & {
  any?: typeof any;
  abort?: typeof abort;
};

const AS: CompatAbortSignal = globalThis.AbortSignal;

function hasAny(AS: CompatAbortSignal): AS is { any: typeof any } {
  return 'any' in AS && typeof AS.any === 'function';
}

if (hasAny(AS)) {
  any = (signals) => AS.any(signals);
} else {
  any = (signals) => {
    for (const signal of signals) {
      if (signal.aborted) {
        return abort(signal.reason);
      }
    }

    const controller = new AbortController();

    const listener = () => {
      controller.abort();

      for (const signal of signals) {
        signal.removeEventListener('abort', listener);
      }
    };

    for (const signal of signals) {
      signal.addEventListener('abort', listener);
    }

    return controller.signal;
  };
}

function hasAbort(AS: CompatAbortSignal): AS is { abort: typeof abort } {
  return 'abort' in AS && typeof AS.abort === 'function';
}

if (hasAbort(AS)) {
  abort = (reason?) => AS.abort(reason);
} else {
  abort = (reason?) => {
    const controller = new AbortController();
    controller.abort(reason);
    return controller.signal;
  };
}
