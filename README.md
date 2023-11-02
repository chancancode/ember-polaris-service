# ember-polaris-service

![A cute cartoon hamster mascot, wearing a white zip up hoodie, standing in front of a mesh of interconnected nodes of various sizes. The majority of these nodes have abstract symbols on them, but among the nodes, three in particualr stood out with the text "import", "Dependency Injection" and "Services" printed on them. Please note that the mascot in the artwork is a generic hamster character. It is not a rendition of the official Ember Tomster™, which is a registered trademark. This character is not an official mascot of Ember. It is not approved or endorsed by the project in any way, just like the code in this addon.](https://github.com/chancancode/ember-polaris-service/assets/55829/4baad632-00af-44eb-84cc-fc596bc71ea0)

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
  config = service(this, Config);
  store = service(this, Store);

  // New power unlocked!
  now = service(this, singleton(Date.now));
  localStorage = service(this, singleton(window.localStorage));

  // Use them normally:
  get color() {
    return this.localStorage.get('color') ?? this.config.get('color');
  }
}
```

```js
// In tests
import { override } from 'ember-polaris-service';
import Config from 'my-app/services/config';

test('some test', async function (assert) {
  class MockConfigService {
    this.map = new Map();

    get(key) {
      return this.map.get(key);
    }

    set(key, value) {
      return this.map.set(key, value);
    }
  }

  override(this.owner, Config, MockConfigService);

  // ...
}
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
to put logic and functionalites for managing and manipulating these states.

Unlike global variables or module states, services are intrinsically linked to
the application's lifecycle and are cleaned up when the application is torn
down, with the added provision to implement custom cleanup logic.

This architecture is particularly advantageous in scenarios like testing and
environments like FastBoot, where application instances are created and torn
down repeatedly, or when mutiple applications or logical applications (Engines)
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
  ember-cli build pipline compiles all your modules into AMD format with their
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
Lookup `model:user` to find the construcot and pass the arguments along.

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
  cost and garbage created by parsing, splitting, joinning and translating all
  these strings for the various names.
- **Dynamism**: While the vast majority of Ember apps simply follow the default
  naming conventions, the fact that the system allows for the possibility for
  arbitrary customizations means that there is no way to tell where things are
  really located without running the code in the browser, which makes it almost
  impossible to things like dead code eliminiation correctly. Many errors are
  only reportable at runtime and often go unnoticed.
- **Complexity**: The myriad of moving parts and the numerous paths objects can
  take to be looked up or registered can be daunting for newcomers and even
  experienced developers, especially when debugging issues in this area. It can
  also make refactorings, especially renaming, moving or deleting code, more
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
with the `<template>` tag (`.gjs`/`.gts`) in the rendeering layering being the
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

## Surface-level APIs

### Defining a service

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

> [!NOTE]
> An complimentary RFC to add a `@destructor` decorator may be beneficial here,
> and would also benefit other kind of use cases outside of services.

### Injecting a service

```js
import Component from '@glimmer/component';
import { service } from 'ember-polaris-service';
import MyService from 'my-app/services/my-service';

export default class MyComponent extends Component {
  myService = service(this, MyService);
}
```

Note that, intrinsically, this requires importing the service into scope, which
provides the module dependency linkage needed for tree-shaking, etc. However,
rather than hardcoding the instantiation of the dependency (`new MyService()`),
the `service()` helper provides the needed indirection for the dependency to be
late-bound and injected at runtime, and can be swapped out as needed.

> [!IMPORTANT]
> A decorator version is being considered, but not yet implemented. It will
> probably work like this:
>
> ```js
> class MyComponent extends Component {
>   @service(MyService) accessor myService;
> }
> ```
>
> Or in TypeScript:
>
> ```ts
> class MyComponent extends Component {
>   @service(MyService) accessor myService!: MyService;
> }
> ```

## Primitives

Traditionally, services are looked up based on a string key on the owner, so
in effect they are instantiated and cached once per the logical key tuple of
`(owner, name)`.

In the new design, services are looked up based on the logical key tuple of
`(scope-object, object-key)`.

### The scope object

```ts
interface Scope {
  // intentionally left blank
}
```

The scope of service is directly analogous to the "owner" concept in the
traditional DI system. The same service will only ever be instantiated once
within the same scope. Once instantiated, they will remain live for the rest
of the scope's lifetime, and cleaned up (running any registered destructors)
when the owning scope is destroyed.

Typically, this will be the application instance, in which case things work
exactly the same as they do today, with the exception that the owner will no
longer have methods like `lookup()` and `register()`.

In fact, as illustrated by the TypeScript interface, the only requirement is
that it is _some kind of object_ (i.e. a valid `WeakMap` key).

This means that, while services are typically scoped to the lifetime of the
application, they are no longer _required_ to be. For example, you can now
instantiate services that are scoped to a route or component, for example. Any
child route or component can and will share the same instance of the service
as long as they pass in the same scope object in the lookup, and the service
will be torndown with the owning scope is destroyed.

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
> The current implementation of `getScope` fallsback to `getOwner`, so that we
> could seamlessly interoperate with the existing construction protocol in the
> framework. In other words, the new service lookups will continue to work on
> any classes/context where the `@service` decorator would have worked today.

### The "object key" (a.k.a. `ServiceFactory`)

```ts
// private
declare const INSTANTIATE: unique symbol;

export interface ServiceFactory<T> {
  [INSTANTIATE]: (scope: Scope) => T;
}
```

The "object key" is the second part of the logical key tuple for a service
lookup. It is combines the string-based "name" of a service _and_ the service
factory in the traditional DI system. It serves a few purpose:

1. It uniquely identifies the service (implied by being part of the lookup key)
2. It tells the DI system how to instantiate the service
3. It links up the inter-module code dependencies

Typically, this object would be the service class, which makes sense as it fits
all three of those purposes – it's clearly identifies the service, it's obvious
how to instantiate the service from the class, and since you'll need to import
the service class into the consuming module, it links up the code dependency as
well.

### Service managers

From the runtime DI system's perspective, the only actual requirement is that
we can figure out how to instantiate the service from this value. The internal
protocol for this is that the object should have an `[INSTANTIATE]` symbol on
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
// i.e. `service(this, getConfig)` can be used to inject the `Configurations`
// object in other places.

export default setServiceManager(
  () => ({
    createService() {
      return getConfig();
    },
  }),
  getConfig,
);
```

## Compatibility

- Ember.js v3.28 or above
- Embroider or ember-auto-import v2

## Installation

```
ember install ember-polaris-service
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
