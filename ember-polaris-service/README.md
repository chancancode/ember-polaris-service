# ember-polaris-service

![A cute cartoon hamster mascot, wearing a white zip up hoodie, standing in front of a mesh of interconnected nodes of various sizes. The majority of these nodes have abstract symbols on them, but among the nodes, three in particular stood out with the text "import", "Dependency Injection" and "Services" printed on them. Please note that the mascot in the artwork is a generic hamster character. It is not a rendition of the official Ember Tomster™, which is a registered trademark. This character is not an official mascot of Ember. It is not approved or endorsed by the project in any way, just like the code in this addon.](https://github.com/chancancode/ember-polaris-service/assets/55829/4baad632-00af-44eb-84cc-fc596bc71ea0)

A usable prototype for previewing Ember Polaris-style service injection.

## TL;DR

```js
// my-app/services/config.js – by convention only, can be wherever
import Service from 'ember-polaris-service';

export default class ConfigService extends Service {
  get(key) {
    /* ... */
  }
  set(key, value) {
    /* ... */
  }
}
```

```js
import Component from '@glimmer/component';
import { service, singleton } from 'ember-polaris-service';
import Config from 'my-app/services/config';
import Store from '@future-ember-data-maybe/store';

class MyComponent extends Component {
  @service(Config) config;
  @service(Store) store;

  // New power unlocked!
  @service(singleton(Date.now)) now;
  @service(singleton(window.localStorage)) localStorage;

  // Use them normally:
  get color() {
    return this.localStorage.get('color') ?? this.config.get('color');
  }
}
```

```js
// In tests
import { override, singleton } from 'ember-polaris-service';
import Config from 'my-app/services/config';

test('some test', async function (assert) {
  class MockConfigService {
    #map = new Map();

    get(key) {
      return this.#map.get(key);
    }

    set(key, value) {
      this.#map.set(key, value);
    }
  }

  override(this.owner, Config, MockConfigService);

  const frozenNow = Date.now();

  override(this.owner, singleton(Date.now), singleton(() => frozenNow));

  // ...
}
```

## Compatibility

> [!IMPORTANT]
> Refers to the **Interoperability** section for more details.

- Ember.js v3.28 or above
- Embroider or ember-auto-import v2

## Installation

```
ember install ember-polaris-service
```

## Introduction

> [!IMPORTANT]
> This addon is experimental in nature. The purpose is to collect real world
> feedback for the design direction of Polaris service injections. At this
> time, it represents our best guess to what the API could look like, but by
> its very nature, everything is subject to change. That being said, the addon
> is entirely in "userspace" code and does not use private APIs, so as long as
> it does what you need, it should be fairly safe to try it out in your app.

### What are services?

In Ember, services provide a robust mechanism for managing global shared states
tied to the application's lifetime. Additionally, services are an ideal place
to put logic and functionalities for managing and manipulating these states.

Unlike global variables or module states, services are intrinsically linked to
the application's lifecycle and are cleaned up when the application is torn
down, with the added provision to implement custom cleanup logic.

This architecture is particularly advantageous in scenarios like testing and
environments like FastBoot, where application instances are created and torn
down repeatedly, or when multiple applications or logical applications (Engines)
coexist and operate within the same shared context.

### What is dependency injection?

Dependency injection (DI) is a technique that allows for writing code that are
loosely coupled to its dependencies. Rather than hardcoding the dependencies
and constructing them internally, your code will declare what dependencies it
needs, and some external system will be in charge of locating, constructing and
supplying these dependencies for your code at runtime.

For example, `import`-ing a class from another module and instantiating it with
the `new` keyword in your code creates a _hardcoded_ dependency on the external
class. This is normally not a bad thing, as we will discuss further below.

On the other hand, in Octane, the `@service` decorator is used to declare a
late-bound, _injected_ dependency on a service by its name. This allows the
services to be externally configured at runtime, or swapped out entirely with a
compatible mock during testing.

### Ember's traditional DI system

Traditionally, Ember's dependency injection system underpins much of the
framework's functionality. It consists of a few key parts:

- **Container**: This is a central repository for the application instance's
  objects. All services, routes, controllers and other classes in an Ember
  application instance are instantiated and managed by the container.
- **Resolver**: When you request an object by name, e.g.`service:storage` or
  `component:user/profile`, if it's not already there, the container delegates
  to the resolver to lookup the code/factory/class/constructor responsible for
  instantiating this type of object.
- **Registry**: Alternatively, constructors (or instances, for singletons) can
  be registered directly with the registry by name. At runtime, the container
  will first consult the registry before performing a resolver lookup, and if a
  registration is present, it will bypass the normal resolver behavior.
- **Owner**: An interface that combines the registry and container API, which
  is to say, it's an object with a `register()` and `lookup()` method on it.
  Under-the-hood, this is typically either an application instance or an engine
  instance. Every object that wishes to participate in the DI system would need
  to be assigned an owner during construction (with the `setOwner` API).
- **loader.js**: While strictly speaking not part of the DI system, it is an
  important participant in this system for a modern Ember app. The classic
  ember-cli build pipeline compiles all your modules into AMD format with their
  full module paths retained verbatim in your application bundler. At runtime,
  the default [`ember-resolver`][ember-resolver] translates the logical names
  into conventional module paths and `require()` the relevant modules.

[ember-resolver]: http://github.com/ember-cli/ember-resolver

Piecing these together with an example:

1. Your class is instantiated and an provided with an owner.
2. The `@service foo;` decorator runs. By default, the name of the field is
   used, so this translates into `owner.lookup('service:foo');`.
3. The container delegates the request to the resolver. On `ember-resolver`,
   that translates into `require("my-app/services/foo");`
4. Alternatively, at some point before the first lookup for this name, you
   could have done `owner.register('service:foo', SomeService, ...);`, in which
   case the resolver is bypassed here and the service will be instantiated with
   the `SomeService` constructor instead. This may be helpful during testing,
   for example.

Historically, the DI system isn't just used for services, it underpins pretty
much every aspect of the framework. `{{some-helper}}` in the template? Lookup
`helper:some-helper` on the container. `store.createRecord('user', { ... })`?
Lookup `model:user` to find the constructor and pass the arguments along.

Furthermore, a lot of these behavior are _customizable_. For example, you could
supply a custom resolver to tweak the module path conventions. In fact, even
the default `ember-resolver` supports multiple module naming conventions (ahem,
[_pods_][pods]) – in the examples above, in each case it would actually attempt
various other paths _first_ before landing on the standard path. In fact, it
doesn't even have to be from `loader.js`, or be based on modules at all. The
[globals-resolver][globals-resolver] looked things up on global variables, for
example.

[pods]: https://github.com/ember-cli/ember-resolver/blob/main/addon/addon/index.js#L56-L60
[globals-resolver]: https://github.com/emberjs/ember.js/blob/v3.28.12/packages/%40ember/application/globals-resolver.js#L15-L83

All in all, the flexible architecture of the traditional DI system has served
us well over the years. It facilitated conventions-over-configuration paradigm
and can be credited as one of the key reasons that we managed to survive and
make the transition from the good of days of scripts, globals, naïve file
concatenations to the world of modules and modern JavaScript development.

### Drawbacks of the traditional DI system

The traditional DI system, while comprehensive and versatile, does come with a
number of drawbacks:

- **Learning Overhead**: Developers new to an Ember app have to first learn and
  become fluent with the naming conventions before they can be productive with
  Ember, especially in apps that uses non-standard conventions.
- **Tooling Integration**: Likewise, tools also need to be taught/configured to
  understand these conventions, if at all possible. Without these, things like
  TypeScript or refactoring tools in your editor will not work.
- **Performance Overhead**: Having to perform these container/resolver lookups
  for everything at adds a significant cost at runtime – not to mention the
  cost and garbage created by parsing, splitting, joining and translating all
  these strings for the various names.
- **Dynamism**: While the vast majority of Ember apps simply follow the default
  naming conventions, the fact that the system allows for the possibility for
  arbitrary customizations means that there is no way to tell where things are
  really located without running the code in the browser, which makes it almost
  impossible to things like dead code elimination correctly. Many errors are
  only reportable at runtime and often go unnoticed.
- **Complexity**: The myriad of moving parts and the numerous paths objects can
  take to be looked up or registered can be daunting for newcomers and even
  experienced developers, especially when debugging issues in this area. It can
  also make refactoring, especially renaming, moving or deleting code, more
  delicate.

In light of these challenges, it's worth considering how the traditional DI
system need to evolve to better align with modern JavaScript best practices,
improve performance, and reduce complexity while still maintaining the core strengths of the framework.

### Transition to explicit imports

The future direction of managing Ember application's code dependency lies in
shedding the complex DI system in favor of straightforward explicit imports.
Here's why this makes sense:

- **Necessity of DI**: For most objects, such as with components and helpers,
  DI isn't even required, nor desirable. It's a rarity to find an instance
  where someone would mock components in tests (in fact, we recommend _against_
  that), rendering this flexibility unwarranted.
- **Flexibility in Conventions**: By pivoting to explicit imports, the Ember
  convention becomes less prescriptive and more suggestive. While it's still
  beneficial to adhere to the Ember convention, diverging from it won't result
  in things breaking. This flexibility erases the need for the customizability.
- **Verbosity vs Clarity**: Granted, explicit imports might be slightly more
  verbose than relying on conventions. However, the shift towards explicitness
  in this area aligns with the broader JavaScript ecosystem — you already need
  to do that when importing functions from third-party libraries, for example.
  Modern tooling, with features like auto-import suggestions, has evolved to
  mitigate verbosity.
- **Tooling Integration**: Virtually all modern tooling natively understands
  and are _built-around_ imports and Node's resolution rules. By aligning with
  these ecosystem trends, we unlock the possibility to benefit many such tools
  without any additional configuration.

The is an ongoing effort to reform Ember's API to eschew string-based lookups,
with the `<template>` tag (`.gjs`/`.gts`) in the rendering layering being the
most notable example.

In the meantime, [Embroider][Embroider] serves as a bridge to codify (literally
in computer code) any remaining necessary conventions to help tools understand
our code. However, the endgame for Ember in the upcoming Polaris Edition is to
completely eliminate string-based lookups.

[Embroider]: https://github.com/embroider-build/embroider

### Services: the one exception

Despite the broad adoption of explicit imports, there's one domain where the
principles of DI remain as relevant as ever: services.

As discussed earlier, services are quintessentially about managing shared
states that spans across the codebase and the runtime lifecycle of the
application. They are specifically designed to be late-bound and swappable at
runtime (in particular, during testing), so they demand a mechanism to be
injected where needed, reinforcing the significance of a DI system.

That being said, even within the realm of services, explicit imports still play
a crucial role. These imports act as static annotations for inter-module code
dependencies. Such annotations are paramount for static analysis optimizations
such as code-splitting and tree-shaking. Without them, we would have no way to
tell where these services are being used, and are forced to preemptively load
every service in the initial payload regardless of its immediate necessity.

In essence, while the broader Ember programming model shifts towards explicit
imports, there remains a need for a DI system in Ember to facilitate service
injections. The challenge, and the path forward, is to devise a leaner, more
streamlined DI system solely tailored for services, while also leveraging the
strengths of explicit imports to optimize performance and code manageability.

## Detailed design

### Surface-level APIs

#### Defining a service

> [!IMPORTANT]
> While this is the most common and convenient way to define a service, it is
> not required or the only way to define a service. The primitives do not make
> any assumptions about services subclassing from `Service`.

```js
import Service from 'ember-polaris-service';

export default class MyService extends Service {
  // ...
}
```

The `Service` super class takes care of some necessary boilerplate to ensure
the the object is proper setup for injections, but otherwise does not do much
else. It is pretty much a drop-in replacement for the existing `Service` class
in Ember, except it does not inherit from `Ember.Object`. Notably, that means
it does not have a special `willDestroy` lifecycle hook. If cleanup logic is
needed, the `registerDestructor` API from `@ember/destroyable` can be used
instead.

```js
import { registerDestructor } from '@ember/destroyable';
import { tracked } from '@glimmer/tracking';
import Service, { type Scope } from 'ember-polaris-service';

// Converts resize events into reactive @tracked properties
export default class ViewportService extends Service {
  @tracked width = window.innerWidth;
  @tracked height = window.innerHeight;

  constructor(scope: Scope) {
    super(scope);

    const listener = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    };

    window.addEventListener("resize", listener);

    registerDestructor(() => {
      window.removeEventListener("resize", listener);
    });
  }
}
```

> [!NOTE]
> An complimentary RFC to add a `@destructor` decorator may be beneficial here,
> and would also benefit other kind of use cases outside of services.

#### Injecting a service

```js
import Component from '@glimmer/component';
import { service } from 'ember-polaris-service';
import MyService from 'my-app/services/my-service';

export default class MyComponent extends Component {
  @service(MyService) myService;
}
```

> [!IMPORTANT]
> When Stage 3 decorators are available, using the `@service` decorator with
> the `accessor` keyword is recommended. This allows the service to be lazily
> looked up on first access, rather than eagerly during class instantiation.
>
> ```js
> import Component from '@glimmer/component';
> import { service } from 'ember-polaris-service';
> import MyService from 'my-app/services/my-service';
>
> export default class MyComponent extends Component {
>   @service(MyService) accessor myService;
> }
> ```

> [!IMPORTANT]
> Using the decorator form in TypeScript requires additional type annotation.
>
> Legacy "experimental" decorators:
>
> ```ts
> import Component from '@glimmer/component';
> import { service } from 'ember-polaris-service';
> import MyService from 'my-app/services/my-service';
>
> export default class MyComponent extends Component {
>   @service(MyService) declare myService: MyService;
> }
> ```
>
> Stage 3 decorators:
>
> ```ts
> import Component from '@glimmer/component';
> import { service } from 'ember-polaris-service';
> import MyService from 'my-app/services/my-service';
>
> export default class MyComponent extends Component {
>   @service(MyService) accessor myService!: MyService;
> }
> ```
>
> An alternative functional form is also supported:
>
> ```ts
> import Component from '@glimmer/component';
> import { service } from 'ember-polaris-service';
> import MyService from 'my-app/services/my-service';
>
> export default class MyComponent extends Component {
>   myService = service(this, MyService);
> }
> ```
>
> This eliminates the need for the type annotation, but the downside is it
> forces an eager lookup during class instantiation.
>
> We are looking to hear your feedback on the real world DX implications in
> this area. The rest of this document will use the functional form.

Note that, intrinsically, this requires importing the service into scope, which
provides the module dependency linkage needed for tree-shaking, etc. However,
rather than hardcoding the instantiation of the dependency (`new MyService()`),
the `service()` helper provides the needed indirection for the dependency to be
late-bound and injected at runtime, and can be swapped out as needed.

### Foundations

Traditionally, services are looked up based on a string key on the owner, so
in effect they are instantiated and cached once per the logical key tuple of
`(owner, name)`.

In the new design, services are looked up based on the logical key tuple of
`(owning-scope, service-token)`.

#### The owning scope

```ts
interface Scope {
  // intentionally left blank
}
```

The "owning scope" of service is directly analogous to the "owner" concept in
the traditional DI system. The same service will only ever be instantiated once
within the same owning scope. Once instantiated, they will live for the rest
of the scope's lifetime and cleaned up (running any registered destructors)
when the owning scope is destroyed.

Typically, this will be the application instance, in which case things work
exactly the same as they do today, with the exception that the owner will no
longer have methods like `lookup()` and `register()`.

In fact, as illustrated by the TypeScript interface, the only requirement is
that it is _some kind of object_ (i.e. a valid `WeakMap` key).

This means that, while services are typically scoped to the lifetime of the
application, they are no longer _required_ to be. For example, you can now
instantiate services that are scoped to a route or component, for example (see
the `scoped()` helper). Any child route or component can and will share the
same instance of the service as long as they pass in the same scope object in
the lookup, and the service will be torn down with the owning scope.

```ts
function setScope(object: object, scope: Scope): void;
function getScope(object: object): Scope | undefined;
```

> [!NOTE]
> Alternatively, we could repurpose the concept of "owner" to fit this new,
> narrower meaning and retained the name `setOwner` and `getOwner`. However,
> we can't just use the existing `setOwner` and `getOwner` API, because things
> currently expect the owner to meet the `{ register, lookup }` interface, so
> that transition would have to be managed somehow.

Analogous to `setOwner` and `getOwner` in the traditional DI system, these
primitives are used to manage the scope of the an object. This has to be done
fairly early during construction, before any injected services are accessed, as
the scope is a necessary part of the lookup key.

Typically, if you are subclassing from a framework-provided class, you would
not have to do this step manually, as it is typically handled for you in the
super class's constructor.

> [!IMPORTANT]
> The current implementation of `getScope` fallbacks to `getOwner`, so that we
> could seamlessly interoperate with the existing construction protocol in the
> framework. In other words, the new service lookups will continue to work on
> any classes/context where the `@service` decorator would have worked today.

#### The service token (a.k.a. `ServiceFactory`)

The "service token" is the second part of the logical key tuple for a service
lookup. It is combines the string-based "name" of a service _and_ the service
factory in the traditional DI system. It serves a few purpose:

1. It uniquely identifies the service (implied by being part of the lookup key)
2. It tells the DI system how to instantiate the service
3. It links up the inter-module code dependencies

Typically, this token would be the service class, which makes sense as it fits
all three of those purposes – it's clearly identifies the service, it's obvious
how to instantiate the service from the class, and since you'll need to import
the service class into the consuming module, it links up the code dependency as
well.

#### Service manager

```ts
// private
declare const INSTANTIATE: unique symbol;

interface ServiceFactory<T> {
  [INSTANTIATE]: (scope: Scope) => T;
}
```

From the runtime DI system's perspective, the only actual requirement is that
we can figure out how to instantiate the service from this token. The internal
protocol for this is that the token should have an `[INSTANTIATE]` symbol on
it, with a function that takes the scope as the only argument and returns the
instantiated service.

However, the `[INSTANTIATE]` symbol is un-exported and private to Ember. You
would never set this directly. Instead, you would use the manager pattern:

```ts
import { setServiceManager } from 'ember-polaris-service';

interface Configurations {
  site: {
    name: string;
    brandColor: string;
    isPrivate: boolean;
  };
  user: {
    locale: string;
    timezone: string;
  };
}

function getConfig(): Configurations {
  return {
    /* ... */
  };
}

// The following code allows the `getConfig` function to be used as a services.

export default setServiceManager(
  () => ({
    createService() {
      return getConfig();
    },
  }),
  getConfig,
);
```

To inject this service:

```ts
import Component from '@glimmer/component';
import { service } from 'ember-polaris-service';
import getConfig, { type Configurations } from 'my-app/services/config';

export default class MyComponent extends Component {
  // The type annotation here is unnecessary and included for clarity in this
  // example only, type inference would have worked correctly here
  config: Configurations = service(this, getConfig);
}
```

> [!IMPORTANT]
> This example is provided for illustrative purposes only. In practice, it can
> be simplified using the `factory()` helper, which handles the boilerplate for
> you, rather than juggling the manager pattern yourself.

As with other manager APIs, there is a fair bit of verbosity required here. It
is quite uncommon for developers to need to use these primitive API directly.
The intention is to provide these verbose but maximally flexible primitives as
building blocks for higher-level abstractions such as the `Service` super class
and the `singleton()` helper.

The complete manager design borrows from and is consistent with other managers
in Ember:

```ts
interface ServiceManager<D extends object, T> {
  createService(definition: D): T;
}

interface ServiceManagerFactory<D extends object, T> {
  (scope: Scope): ServiceManager<D, T>;
}

function setServiceManager<D extends object, T>(
  factory: ServiceManagerFactory<D, T>,
  definition: D,
): D & ServiceFactory<T>;
```

A service manager is an object with a `createService` method, that accepts the
service token as an argument, and instantiates the service from that. This can
be extended to have more capabilities in the future, but that is currently the
only requirement.

The `setServiceManager` function attaches the manager to the token, by way of
defining the internal `[INSTANTIATE]` on the token object, which makes it a
`ServiceFactory`. For convenience, it returns the same object back to its
caller.

Note that, rather than `setServiceManager` accepting the manager directly as
argument, it itself uses a factory pattern and takes a callback that returns
the manager instead. This is for consistency with the other managers design.
In a lot of cases, this isn't needed, but it can come in handy if the manager
has states it wants to associate with the owning scope, or that it itself has
clean up logic that needs to be executed when the scope is destroyed.

Note that the token is passed in to `createService` may not be the same as
the one that is passed to `setServiceManager`. This is because `[INSTANTIATE]`,
like any other properties in JavaScript, is inherited through the prototype
chain. This means, when calling `setServiceManager` on a class, its subclasses
will inherit the same manager by default. Alternatively, `setServiceManager` on
`SomeClass.prototype` will make all _instances_ of that class inherit this by
default.

For concrete examples, the `Service` class and the `singleton()` helper uses
these techniques under-the-hood.

### Primitives

#### Service lookups

```ts
function lookup<T>(scope: Scope, factory: ServiceFactory<T>): T;
```

The core primitive for looking up services is the `lookup` function, which
accepts the owning scope and the factory and returns the instantiated service.
This is analogous to and a generalized version of `owner.lookup('service:...')`
in the traditional DI system.

> [!IMPORTANT]
> The key difference between the primitive `lookup()` function and the surface
> API `service()` is in the first argument. In `lookup()`, this argument is the
> owning scope itself, whereas the first argument in `service()` is an object
> that is already associated with an owning scope. Essentially, `service()`
> exists so that you don't have to write `lookup(getScope(this), MyService)`.

#### Service overrides

```ts
function override<T>(
  scope: Scope,
  factory: ServiceFactory<T>,
  override: ServiceFactory<T>,
);
```

The core primitive for overriding services is the `override` function, which
accepts the owning scope, the original factory, and the override factory as
arguments. This is a leaner version of `owner.register('service:...', ... )`
in the traditional DI system.

> [!IMPORTANT]
> This must be done before the service is looked up for the first time. In
> development mode, an error will be thrown when attempting to override an
> already instantiated service.

### Interoperability

#### Defining services

With the new design, services no longer have to be placed in a specific
location on the filesystem, as they are resolved with actual imports. That
said, for most services, you probably do want to place them in the standard
`app/services` folder.

> [!IMPORTANT]
> Beware that, by default, modules in the `app/services` folder are always
> included in the `@embroider/compat` build. You can opt out, partially or
> entirely, with the `staticAppPaths` config option.

An modules in this folder are exposed to the traditional DI system, in that
they will be available for lookup via `owner.lookup('service:$NAME')` or
equivalently via the Octane `@service` decorator. However, by default, this
will fail when you subclass from the `Service` class provided here, because
it does not have the same instantiation protocol the traditional DI system
expects.

If you want to make your new services available this way, you can import
from the `compat` module, which provides a shim to bridge both systems:

```ts
// my-app/services/config.ts
import Service from 'ember-polaris-service/compat';

// This class works with `lookup(...)`, `service(...)`, but also the
// traditional `owner.lookup('service:config')` and `@service config`
export default class ConfigService extends Service {
  // ...
}
```

#### Looking up services

In addition to the `Service` shim, the `compat` module also provides a version
of the `@service` decorator.

```js
import Component from '@glimmer/component';
import { service } from 'ember-polaris-service/compat';
import Config from 'my-app/services/config';
import Store from '@future-ember-data-maybe/store';

class MyComponent extends Component {
  @service(Config) config;
  @service(Store) store;
}
```

In addition accepting `ServiceFactory` as argument, this hybrid `@service`
decorator also allows classic services – subclasses of `@ember/service`. This
allows you to start linking up your module dependency graph and consistently
use the same style of service injection syntax across the codebase before
fully migrating to this new system.

When the hybrid `@service` decorator encounters a non `ServiceFactory` argument
it falls back to a string-based lookup on the traditional DI system, using the
property name as they key. Like the traditional `@service` decorator, it also
optionally takes a second string argument for the lookup key, for cases where
the property key cannot be used to identify the service (e.g. there are slashes
in the service name).

> [!IMPORTANT]
> The `service` function from the `compat` module can only be used in decorator
> form. It cannot be used in the functional `service(this, MyService)` form. It
> needs to see the property name for the traditional string-based lookup.

### Helpers

#### Singleton services

A common use case for services is to indirect access to global or third-party
APIs, so that they can be easily stubbed out in tests.

The `singleton()` helper exists to facilitate this pattern:

```ts
import Component from '@glimmer/component';
import { service, singleton } from 'ember-polaris-service';
import Config from 'my-app/services/config';

class MyComponent extends Component {
  now = service(this, singleton(Date.now));
  localStorage = service(this, singleton(window.localStorage));
}
```

The `singleton()` helper adapts any object into a `ServiceFactory<T>` that, by
default, simply return the same object during instantiation. It is "stable", in
that given the same object, it will always return the same wrapper. In other
words, `singleton(Date.now) === singleton(Date.now)`. This makes it possible to
use the returned wrapper as the unique service token.

In this example, the component can consume the injected APIs like normal, such
as `this.now()` or `this.localStorage.set(...)`, etc. This behaves the same as
`now = Date.now;` or `localStorage = window.localStorage;`.

However, the extra indirection allows these APIs to be swapped out in tests
without mocking/stubbing the globals directly:

```ts
// In tests
import { override, singleton } from 'ember-polaris-service';
import Config from 'my-app/services/config';

test('some test', async function (assert) {
  class MockStorage implements Storage {
    #map = new Map<string, string>();

    getItem(key: string): string | null {
      return this.#map.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
      this.#map.set(key, value);
    }

    // ...
  }

  override(this.owner, Config, MockStorage);

  const frozenNow = Date.now();

  override(this.owner, singleton(Date.now), singleton(() => frozenNow));

  // ...
}
```

> [!NOTE]
> While the `singleton()` helper offers a quick way to convert arbitrary
> objects into services, in many cases, it would be beneficial to carefully
> consider your actual requirements and hand-craft a smaller, tailored service
> class that delegates to these external APIs.
>
> For example, the built-in `Storage` interface includes additional things such
> as `key()`, `length`, etc, which may not be relevant to your needs. By using
> actual `localStorage` as the service definition, your mock would also have to
> implement these unnecessary details to be correct.
>
> It may ultimately be more appropriate to have your own `StorageService` class
> that exposes only the `set()` and `get()` methods that uses `localStorage`
> internally by default, and the mock can implement just those two methods.
>
> Think about it this way: while you _can_ just have a single "globals service"
> `singleton(window)` to rule them all, that is probably not a great idea!

While not mocking/stubbing globals is just good practice, this pattern becomes
_essential_ as we transition to strict ES modules, since module exports cannot
be mocked/stubbed. This approach, on the other hand, would work just fine:

```ts
import Component from '@glimmer/component';
import { service, singleton } from 'ember-polaris-service';
import { shuffle } from 'lodash';

class MyComponent extends Component {
  shuffle = service(this, singleton(shuffle));
}
```

```ts
// In tests
import { override, singleton } from 'ember-polaris-service';
import { shuffle } from 'lodash';

test('some test', async function (assert) {
  function mockShuffle<T>(array: T[]): T[] {
    return array.toReversed();
  }

  override(this.owner, singleton(shuffle), singleton(mockShuffle)));

  // ...
}
```

#### Factory functions

The `factory` adapter allows anything else to be convert into a service by
providing a factory function. For example, the `getConfig` example above can
be simplified into:

```ts
import { factory } from 'ember-polaris-service';

interface Configurations {
  site: {
    name: string;
    brandColor: string;
    isPrivate: boolean;
  };
  user: {
    locale: string;
    timezone: string;
  };
}

function getConfig(): Configurations {
  return {
    /* ... */
  };
}

export default factory(getConfig);
```

```ts
import Component from '@glimmer/component';
import { service } from 'ember-polaris-service';
import getConfig, { type Configurations } from 'my-app/services/config';

export default class MyComponent extends Component {
  // The type annotation here is unnecessary and included for clarity in this
  // example only, type inference would have worked correctly here
  config: Configurations = service(this, getConfig);
}
```

This can also be used to adapt arbitrary external APIs without converting them
into subclasses of `Service`. Additionally, since the factory have access to
the scope, it can use that to lookup other services or register destructors as
well.

```ts
import { factory, lookup } from 'ember-polaris-service';
import getConfig from 'my-app/services/config';

function DateTimeFormat(scope: Scope): Intl.DateTimeFormat {
  const config = lookup(scope, getConfig);
  return new Intl.DateTimeFormat(config.user.locale);
}

export default factory(DateTimeFormat);
```

Whereas `singleton()` allows using an existing value as a service, `factory()`
allows for deferring producing that value until it is needed. It essentially
allows you to attach a lazily-called function to the owning scope, and ensuring
once called, its return value will be cached for the lifetime of the owning
scope. Further, since the factory have access to the scope, it can lookup other
services or register destructors as well.

#### Scoped services

The `scoped()` helper can be used to instantiate a service scoped to something
other than the inherited parent scope:

```ts
import Component from '@glimmer/component';
import { scoped, service, singleton } from 'ember-polaris-service';
import RandomNumberGenerator from 'my-app/services/rng';

class Game extends Component {
  rng = service(scoped(this), RandomNumberGenerator);
}
```

In this example, the instantiated `RandomNumberGenerator` service is be unique
to the particular component instance, and will be torn down when the component
instance is torn down. In effect, this allows multiple instances of a service
to be instantiated, across different parts of the application, with different
lifetimes attached.

In this example, `service(scoped(this), RandomNumberGenerator)` has the same
effect as `lookup(this, RandomNumberGenerator)`, in contrast to the typical
behavior of `lookup(getScope(this), RandomNumberGenerator)`, which would have
looked up the shared `RandomNumberGenerator` on the the application instance.

While, in this case, the same result could be accomplished with `lookup()`
instead of `service()`, the `scoped()` helper returns a wrapper object that has
the component instance set as its owning scope, and can be shared to outside
consumers without exposing the component instance itself.

For example, `{{yield (scoped this)}}` can give other components a way to
lookup or instantiate additional services within the same scope, without giving
direct access to the component's internal states (fields, methods, etc).

> [!WARNING]
> One potential problem with this code is that it is virtually impossible to
> override in tests – without additional coordination, there is no way to
> obtain a reference to the component instance directly, which is required to
> call `override()`, and it also needs to happen early enough before anything
> is looked up.
>
> Perhaps a better approach for this component to take the "game scope" as an
> argument, at least optionally one, and use `this.args.scope ?? scoped(this)`
> for the lookup. That way, the test can setup an scope with the appropriate
> overrides before calling the component.
>
> In a way, the ability to create nested lookup solves some of the use cases
> that a "context" API may be used for ("avoiding deep prop-drilling"). It
> allows far away (in the call stack) to share a bunch of states by just
> threading through a single `scoped()` wrapper.

### Patterns

#### Configuring/composing services

By definition, services cannot easily take arguments. For example, this does
not work:

```ts
import Component from '@glimmer/component';
import { scoped, service } from 'ember-polaris-service';
import { SeededRandom } from 'my-app/services/rng';

class MyComponent extends Component {
  // Don't do this!
  rng = service(this, SeededRandom(12345));
}
```

While this is valid JavaScript, and can be made to do _something_, it most
likely does not do what you want.

The purpose of services is to share state between multiple parties, and to do
that they must all have a way to uniquely identify "the same piece of state"
through the service token. When the token itself is dynamic, then no two places
in the app would be able to share the "same" instance of the service.

Depending on what you are looking to accomplish, there are a few possible
alternatives. If, in this example, you are looking to hardcode a well-known
seed for the RNG, perhaps that can be made into a named subclass, which can be
easily shared:

```ts
// app/services/rng
import { type Scope, factory } from 'ember-polaris-service';

class SeededRandom {
  constructor(private seed: number) {
    // ...
  }

  next(): number {
    // ...
  }
}

export const WellKnownSeededRandom = factory(() => {
  return new SeededRandom(12345);
});
```

Alternatively, the configuration for a service can itself be injected:

```ts
// app/services/rng
import { type Scope, factory, lookup } from 'ember-polaris-service';

class SeededRandom {
  constructor(private seed: number) {
    // ...
  }

  next(): number {
    // ...
  }
}

export const RandomSeed = () => Math.random();

export const RandomNumberGenerator = factory((scope: Scope) => {
  let seed = lookup(scope, RandomSeed);
  return new SeededRandom(seed);
});
```

#### Private/isolated services

With the service token being a JavaScript value – as opposed to a string key
in the traditional DI system – you are now able to control who has access to
your service with standard JavaScript patterns.

Traditionally, in engines, we needed to create a nested, isolated registry and
container for each engine. The purpose is such that engines can define their
own services for the own shared state, without those states leaking out into
the host app, and vice versa.

With the new design, this wouldn't be necessary. As long as the engine – or any
addon packages for that matter – keep their services private an unexported with
the `"exports"` field in their `package.json`, naturally, those services are
"isolated" to the engine. Likewise, it would be impossible for engines to
accidentally consume the host app's services, as it would have no way to gain
access to those service tokens in the first place.

In this world, privacy and access control comes down to privacy and access to
the JavaScript values, and they can also be deliberately shared using any means
that is appropriate to the situation – module exports, `{{yield}}`s, argument
passing, global variables, etc.

#### Abstract services

Sometimes, service overrides are useful outside of tests, too. Let's say you
have a service for consuming an external mapping API, something like Google
Maps, but your team is testing out and contemplating switching to a different
provider that offers a similar service for your needs.

You could define an abstract service class that describe the common interface:

```ts
// app/services/mapping/index
import Service from 'ember-polaris-service';

export class Coordinates {
  constructor(lat: number, lng: number) {}
}

// If using JavaScript, you could do the same without the abstract keyword,
// just define an empty class with comments, or define the method with empty
// implementations that throws, expecting them the concrete implementations
// to override them.

export default abstract class MappingService extends Service {
  abstract addressToCoordinates(address: string): Promise<Coordinates>;
  abstract coordinatesToAddress(coordinates: Coordinates): Promise<string>;
  // ...
}
```

This defines the abstract interface _and_ a common service token that can be
used to inject the mapping service in the rest of the app, regardless of which
concrete implementation in used:

```ts
import { action } from '@ember/action';
import Component from '@glimmer/component';
import { service } from 'ember-polaris-service';
import MappingService from 'my-app/services/mapping';

export default class MyComponent extends Component {
  mapping = service(this, MappingService);

  async jumpTo(address: string): void {
    let coordinates = await this.mapping.addressToCoordinates(address);
    // ...do something with it...
  }
}
```

To provide concrete implementations:

```ts
// app/services/mapping/google
import MappingService from '.';

export default class GoogleMappingService extends MappingService {
  async addressToCoordinates(address: string): Promise<Coordinates> {
    // ...use the Google API
  }

  async coordinatesToAddress(coordinates: Coordinates): Promise<string> {
    // ...use the Google API
  }

  // ...
}
```

```ts
// app/services/mapping/osm
import MappingService from '.';

export default class OpenStreetMapsMappingService extends MappingService {
  async addressToCoordinates(address: string): Promise<Coordinates> {
    // ...use the OSM API
  }

  async coordinatesToAddress(coordinates: Coordinates): Promise<string> {
    // ...use the OSM API
  }

  // ...
}
```

Note that, if nothing is importing these implementations, then they won't be
included in the build. This can be a good thing – for example, if the new OSM
implementations are only meant for internal testing on a special staging, you
can include that only in that environment.

You do have to configure an actual implementation _somewhere_ though, say in
an instance initializer:

```ts
// app/instance-initializers/mapping
import { macroCondition, getOwnConfig, importSync } from '@embroider/macros';
import { override } from 'ember-polaris-service';
import MappingService from 'app/services/mapping';

export function initialize(owner) {
  let implementation: typeof MappingService;

  if (macroCondition(getOwnConfig().useOSM)) {
    implementation = importSync('app/services/mapping/osm').default;
  } else {
    implementation = importSync('app/services/mapping/google').default;
  }

  override(owner, MappingService, implementation);
}

export default {
  initialize,
};
```

This approach ensures only the necessary implementation is included.

Alternatively, you can include both and decide which one to use at runtime:

```ts
// app/instance-initializers/mapping
import { lookup, override } from 'ember-polaris-service';
import ConfigService from 'app/services/config';
import MappingService from 'app/services/mapping';
import GoogleMappingService from 'app/services/google';
import OpenStreetMapMappingService from 'app/services/osm';

export function initialize(owner) {
  // ...or based on URL, query params, global variables, etc
  if (lookup(owner, ConfigService).useOSM) {
    override(owner, MappingService, OpenStreetMapMappingService);
  } else {
    override(owner, MappingService, GoogleMappingService);
  }
}

export default {
  initialize,
};
```

Note that, by doing this in an instance initializer, the service gets included
into the initial bundle, as opposed to only in the bundles where the service is
needed. This may be important if the service brings in a lot of code and is
only needed in infrequently accessed part of the app.

An alternatively would be to put this selection logic inside the file where the
service token is defined:

```ts
// app/services/mapping/index
import { type Scope, factory } from 'ember-polaris-service';
import ConfigService from '../config';
import MappingService from './abstract';
import GoogleMappingService from './google';
import OpenStreetMapMappingService from './osm';

export default factory((scope: Scope): MappingService => {
  // ...or based on URL, query params, global variables, etc
  if (lookup(owner, ConfigService).useOSM) {
    return new OpenStreetMapMappingService(scope);
  } else {
    return new GoogleMappingService(scope);
  }
});
```

That way, the module dependencies are all "wired up" – parts of the apps that
depends on the mapping service will import this module, which in turns, import
the relevant concrete implementation(s).

Finally, since all the operations on the service are inherently async in this
case (as it talks to an external web service), another option is to load the
relevant code on demand:

```ts
// app/services/mapping/index
import { type Scope, service } from 'ember-polaris-service';
import ConfigService from '../config';
import AbstractMappingService, { Coordinates } from './abstract';

export default class MappingService extends AbstractMappingService {
  config = service(this, ConfigService);

  async addressToCoordinates(address: string): Promise<Coordinates> {
    return (await this.implementation()).addressToCoordinates(address);
  }

  async coordinatesToAddress(coordinates: Coordinates): Promise<string> {
    return (await this.implementation()).coordinatesToAddress(coordinates);
  }

  // ...

  private async implementation(): Promise<AbstractMappingService> {
    if (this.config.useOSM) {
      return await import('./osm');
    } else {
      return await import('./google');
    }
  }
}
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).

## Thanks

Initial development of this addon and proposal partially funded by
[Discourse](https://discourse.org).
