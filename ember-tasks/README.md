# ember-tasks

Simple tasks abstraction for routing and beyond.

## Compatibility

- Ember.js v3.28 or above
- Embroider or ember-auto-import v2

## Installation

```
ember install ember-tasks
```

## Introduction

### What is a task?

A task is a projection of an asynchronous process into a synchronous value.
Simply put, it allows you to synchronously introspect the state of a promise:

```js
import Task from 'ember-tasks';

async function loadSomeData() {
  /* ... */
}

let dataTask = Task.promise(loadSomeData());

// Note that there is no await here
dataTask.pending; // true
dataTask.resolved; // false
dataTask.rejected; // false
dataTask.value; // not resolved yet, it throws!

// ...later...
dataTask.pending; // false
dataTask.resolved; // true
dataTask.rejected; // false
dataTask.value; // "some data"

let anotherTask = Task.promise(loadSomeData());

// ...later...

// This time it didn't work out
anotherTask.pending; // false
anotherTask.resolved; // false
anotherTask.rejected; // true
anotherTask.reason; // SomeError
```

Because the task API is synchronous, this makes it a useful building block for
rendering the result of an asynchronous process in templates:

```hbs
<template>
  {{#if @myTask.resolved}}
    It worked:
    {{@myTask.value}}
  {{else if @myTask.pending}}
    Loading...
  {{else}}
    Oops, sorry we ran into an issue.
  {{/if}}
</template>
```

The internal states of a task is fully reactive (i.e. `@tracked`), so your
template will be updated accordingly when things change.

### Running a task

Usually you don't just already have a promise lying around. You actively want
to run some asynchronous code and expose that as a `Task` to consuming code:

```js
import Task from "ember-tasks";

let task = Task.run(async () {
  // ...do stuff...
});

task.pending; // true

// ...later...
if (task.resolved) {
  console.log(`it worked: ${task.value}`);
}
```

### Aborting a task

Sometimes it may be useful to abort a task early before it is completed. Tasks
have an `abort()` method you can call in these situation:

```js
let task = ...;

// ...later...

// Changed my mind!
task.abort();
```

While it is always safe to call `abort()` on a task, what exactly happens when
you do that depends on a few different factors:

- If the task is already settled (e.g. resolved), then nothing happens.
- If the task is not an abortable task, then nothing happens.
- Otherwise, the task may be transitioned into the `"aborted"` state.

The "aborted" state is an additional state unique to tasks, in addition to the
standard "pending", "resolved", "rejected" state that promises have:

```js
task.abort(new SomeError('...')); // reason argument is optional
task.pending; // false
task.resolved; // false
task.rejected; // false
task.aborted; // true
task.reason; // SomeError: ...
```

The "aborted" state mostly behaves the same as the "rejected" state, in that
they both share a `reason` field that hosts the rejection/abort reason, which
is usually, but not always, an `Error` object.

If a task can be successfully aborted, it will be reflected synchronously. That
is, you will be able to observe that `task.aborted === true` without needing to
`await`. Otherwise, it means that the task cannot be aborted.

Even when a task can be aborted, the only guarantee is that the task's internal
state will be updated to reflect that it has been aborted, and for what reason.

Ultimately, it is up to the task code to decide how, if at all, to honor the
request to abort. For example, if the task is to `fetch()` some remote data,
there is no guarantee that the underlying `fetch()` request will be aborted.
However, a task that has transitioned into the "aborted" state is considered
settled, and will never transition into another state. So, even if "runaway"
`fetch()` request has returned with the requested data, you will never observe
that on the aborted task.

### Writing an abortable task

The most convenient way to write an abortable task is to use async generator
functions:

```js
import Task from 'ember-tasks';

let task = Task.run(async function* () {
  try {
    await doSomeStuff();

    yield;

    await doMoreStuff();
    await doEvenMoreStuffWithoutYielding();

    yield;

    return 'done!';
  } finally {
    // optional cleanup code
  }
});
```

This largely behaves the same way as your normal async function, with the
additions of some _yield points_. Yield points allows you to _voluntarily_
yield control to observe possible aborts. If the task has been aborted at that
point, it will throw an error (the `reason` passed to `abort()`), allowing you
to handle any necessary cleanup in a `finally` block.

Because you are in total control of when to insert these yield points, you
can decide when is a good time to handle/observe aborts. For example, there may
be groups of asynchronous operations that should be performed transactionally,
by offering you the choice in when to insert yield points, you can guarantee
that your code won't be interrupted in unexpected places.

In addition, you can also choose to insert yield points in between synchronous
code blocks. Yield points have `await undefined;` semantics, i.e. it inserts a
"micro task", so effectively yield points are a way to yield control back to
the browser runtime to run some other code (rendering, event handlers, etc),
some of which could make the decision to `abort()` your task.

Under the hood, aborts are communicated and coordinated via the `AbortSignal`
API. We will cover that in more details later, but the basic API it provides
is a `aborted` boolean property to indicate if the task has been aborted, and
if so, a `reason` property.

The abort signal is provided to your callback as an argument. The example above
is roughly equivalently to:

```js
let task = Task.run(async (signal) => {
  try {
    await doSomeStuff();

    await undefined;
    if (signal.aborted) {
      throw signal.reason;
    }

    await doMoreStuff();
    await doEvenMoreStuffWithoutYielding();

    await undefined;
    if (signal.aborted) {
      throw signal.reason;
    }

    return 'done!';
  } finally {
    // optional cleanup code
  }
});
```

There is no practical reason to write it this way over the generator version,
but the `signal` argument serves two important purposes:

1. If the task has reached a `catch` or `finally` block, it allows you to check
   if that was due to the task being aborted or if it's due to other unrelated
   errors.

2. The signal can be threaded through other APIs that supports it, including
   `fetch()` and nested tasks.

To see this in action:

```js
let task = Task.run(async (signal) => {
  try {
    // Pass the same AbortSignal to a fetch request. If the task is aborted,
    // the fetch() will be aborted as well.
    let response = await fetch('...', { signal });

    yield;

    // Likewise, if this task is aborted, the nested task will be aborted too
    let nestedTask = Task.run(someTaskFunction, { signal });

    // We haven't seen this before, but Task has a promise property that turns
    // it back into a promise, exactly so we can do this. Here, assuming the
    // nestedTask resolves, then result === nestedTask.value
    let result = await nestedTask.promise;

    return doStuff(result);
  } catch (error) {
    if (signal.aborted) {
      // we are here because of an abort
    } else {
      // error is unrelated
    }
  }
});
```

### The Task interface

```ts
type Task<T> = Pending<T> | Resolved<T> | Rejected<T> | Aborted<T>;

interface Pending<T> {
  state: 'pending';
  promise: Promise<T>;
  pending: true;
  settled: false;
  terminated: false;
  resolved: false;
  rejected: false;
  aborted: false;
  abort(reason?: unknown): void;
  throwIfTerminated(): void;
}

interface Resolved<T> {
  state: 'resolved';
  promise: Promise<T>;
  pending: false;
  settled: true;
  terminated: false;
  resolved: true;
  rejected: false;
  aborted: false;
  value: T;
  abort(reason?: unknown): void;
  throwIfTerminated(): void;
}

interface Rejected<T> {
  state: 'rejected';
  promise: Promise<T>;
  pending: false;
  settled: true;
  terminated: true;
  resolved: false;
  rejected: true;
  aborted: false;
  reason: unknown;
  abort(reason?: unknown): void;
  throwIfTerminated(): never;
}

interface Aborted<T> {
  state: 'aborted';
  promise: Promise<T>;
  pending: false;
  settled: true;
  terminated: true;
  resolved: false;
  rejected: false;
  aborted: true;
  reason: unknown;
  abort(reason?: unknown): void;
  throwIfTerminated(): never;
}
```

### Other helpers

#### `Task.pending`

```ts
function pending<T>(): Task<T>;
```

Creates a "hung" task permanently stuck in the "pending" state.

#### `Task.resolve`

```ts
function resolve<T>(value: T): Task<T>;
```

Creates a task settled into the "resolved" state with `value`.

#### `Task.rejected`

```ts
function rejected<T>(reason?: unknown): Task<T>;
```

Creates a task settled into the "rejected" state with `reason`.

#### `Task.abort`

```ts
function abort<T>(reason?: unknown): Task<T>;
```

Creates a task settled into the "aborted" state with `reason`.

#### `Task.promise`

```ts
function promise<T>(promise: Promise<T>, options?: AbortOptions): Task<T>;
```

Project an existing promise into a task. The task will always synchronously
start out in the "pending" state. See the section on `AbortOptions` for details
on the options.

#### `Task.run`

```ts
type Runnable<T> =
  | T
  | Promise<T>
  | Generator<void, T, void>
  | AsyncGenerator<void, T, void>;
type RunnableFunction<T> = (signal: AbortSignal) => Runnable<T>;
function run<T>(fn: RunnableFunction<T>, options?: AbortOptions): Task<T>;
```

Run a task function to completion. The task function will be called with an
`AbortSignal` as argument. The task function can be a regular function (return
the resolved value synchronously), an async function (returning a promise), a
generator or asynchronous generator function. For generators, regardless of
whether the generator is synchronous or not, yield points are always async.

#### `AbortOptions`

```ts
type AbortOptions =
  | { abortable?: boolean; signal?: AbortSignal }
  | { controller?: AbortController };
```

- `abortable`: By default, tasks created from `Task.promise` or `Task.run` are
  externally abortable. This means calling the `abort()` method on a pending
  task will transition it into the "aborted" state. This can be disabled by
  passing `abortable: false`.
- `signal`: By default, tasks internally creates its own `AbortSignal`, but one
  can be passed in externally as well, which is useful when chaining/nesting
  related tasks. If the task is not externally abortable (`abortable = false`),
  then the signal will be passed on to the task function in `Task.run`. If the
  task is externally abortable (`abortable = true`, the default), a combined
  signal will be created that aborts when _either_ `abort()` is called or when
  this external signal is aborted. In that case, the first aborted signal will
  become the `reason` for the abort.
- `controller`: Alternatively, an `AbortController` can be passed directly, in
  which case, `controller.signal` will be used as the task's `AbortSignal` and
  passed on to the task function in `Task.run`, and `abort()` on the task will
  call `controller.abort()`, which aborts the associated signal and thus the
  task itself.

### TypeScript support

This library is fully typed. Because `Task<T>` is defined as a union type,
checking the boolean fields (e.g. `pending`, `resolved`) appropriately narrows
its type for TypeScript. In addition, `throwIfTerminated()` can be used to
conveniently re-throw the rejection or abort reason, but also narrows the type
for TypeScript.

One caveat when using TypeScript is that the default export from the package
refers to the constant value that has the `Task.*` helpers on it, not the
`Task<T>` union type. For that reason, you may find it more convenient to just
import the `type Task` and the individual helper functions directly:

```ts
import { type Task, run } from 'ember-tasks';
```

### Relationship with Polaris routing

This library is intended to serve as a useful building block for handling
loading states in Polaris routes.

### Relationship with ember-concurrency

This library is heavily inspired by `ember-concurrency`.

- `Task` is essentially a bare bones version of `TaskInstance`
- `ember-tasks` decouples tasks from the class features, making it usable in
  any JavaScript context, not just within classes
- `ember-tasks` decouples "task spawning"/"task scheduling" from the core
  concept of a task (those utilities can be provided later or separately)
- Integration with `AbortController`/`AbortSignal` to provide a mechanism to
  explicitly link together related tasks
- Another advancement of the status quo is the decoupling of `await` points
  and `yield` points for cooperative scheduling
- Sidesteps the "canceled" vs "cancelled" debate :)

### Relationship with ember-promise-helpers

Tasks, specifically `Task.promise`, essentially provides a version of the
ember-promise-helpers helpers that are usable in any JavaScript context, not
just in templates.

### Relationship with ember-resources

Tasks are reactive in the sense that they its states properties are tracked, so
it may be a useful type to return from within an ember-resource resource.

### Relationship with TC39's "Explicit Resource Management" proposal

Tasks are conceptually resources in the context of this proposal, which is to
say that tasks should have a `[Symbol.dispose]` property that calls the task's
`abort()` method when the task object tracked with `using` goes out of scope.

This is not yet implemented as I am not sure how to do it "correctly" – whether
the library should include a polyfill or expects the app to bring one, what
TypeScript target to set and whether that impacts consuming apps, etc.

Once these issues are sorted out, this will be implemented, which allows for
nicer tasks chaining/composition with the new `using` keyword.

## Prior Art

- [ember-concurrency](https://ember-concurrency.com/docs/introduction/)
- [ember-promise-helpers](https://github.com/fivetanley/ember-promise-helpers)

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).

## Thanks

Initial development of this addon and proposal partially funded by
[Discourse](https://discourse.org).
