# Crafting an Component

A component is all about handling a small portion of functionality or
an integration with a 3'rd party service (e.g. [CodeClimate](https://codeclimate.com), [Snyk.io](https://snyk.io)).


### Before Starting

All components **MUST** work with event system and avoid
hooking into codebase, especially private/protected parts of it.

The most important functions are:
- `emitter.on` & `emitter.emit`
- `emitter.onBlocking` & `emitter.emitBlocking`

`emitter.onBlocking` - is executed sequentially and is waiting for a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) to be returned.

The last but not the least- you **MUST** know the following mantra:

> **Everything is a component, Everything is a component, Everything is a component...**


### Ecosystem

`REciNK` components ecosystem is pretty straightforward - 
it uses NPM packages (e.g. [recink-codeclimate](https://www.npmjs.com/package/recink-codeclimate)). 

When running `recink component add codeclimate` it installs 
`recink-codeclimate` package globally (think `npm install -g recink-codeclimate`)
and adds it to internal registry to have it run on the next `recink run unit` or `recink run e2e`.

> A good practice it to have the component prefixed with `recink-`.


### Generating Boilerplate Component

To generate a boilerplate component simply run:

- `recink component generate ~/Desktop --name 'hello'`
- `cd ~/Desktop/hello`
- `ls -la`

You should see something like:

```shell
AlexanderC:hello AlexanderC$ ls -la
total 16
drwxr-xr-x   6 AlexanderC  staff   204 Jul  4 10:29 .
drwx------+ 12 AlexanderC  staff   408 Jul  4 10:29 ..
-rw-r--r--   1 AlexanderC  staff  1374 Jul  4 10:29 README.md
-rw-r--r--   1 AlexanderC  staff   877 Jul  4 10:29 package.json
drwxr-xr-x   3 AlexanderC  staff   102 Jul  4 10:29 src
drwxr-xr-x   3 AlexanderC  staff   102 Jul  4 10:29 template
```

To test your component run:

`HELLO="John" recink run ~/Desktop/hello ~/Desktop/hello/template`


### Component Interface

He're the generated boilerplate component code `src/hello-component.js`:

```javascript
'use strict';

const DependantConfigBasedComponent = require('recink/src/component/dependant-config-based-component');

/**
 * Hello component
 */
class HelloComponent extends DependantConfigBasedComponent {
  /**
   * @returns {string}
   */
  get name() {
    return 'hello';
  }
  
  /**
   * Add the components Hello depends on
   *
   * @returns {string[]}
   */
  get dependencies() {
    return [];
  }
  
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    const name = this.container.get('name', 'World');
  
    this.logger.info(this.logger.chalk.yellow.bold(`Hello ${ name }!`));
  
    return Promise.resolve();
  }
}

module.exports = HelloComponent;
```

Note that if you have any components you depend on add them to the `dependencies` getter, just like this:

```javascript
/**
 * Add the components Hello depends on
 *
 * @returns {string[]}
 */
get dependencies() {
  return [ 'test', 'coverage' ];
}
```

> Note that your component will be disabled if any of dependencies you've specified is missing or disabled.

### Preparing for `run()`

`REciNK` allows the components prepare for `run()` by implemeting `init()` method:

```javascript
/**
  * @param {Emitter} emitter
  * 
  * @returns {Promise}
  */
init(emitter) {
  return Promise.resolve();
}
```

> `REciNK` will wait for all `init()` calls resolved before invoking `run()`


### Cleaning Up Allocated Resources

A good practive would be cleaning up allocated resources.
`REciNK` comes up with a method called `teardown()` that is invoked 
after all components have finished their execution:

```javascript
/**
  * @param {Emitter} emitter
  * 
  * @returns {Promise}
  */
teardown(emitter) {
  return Promise.resolve();
}
```

> Note that `teardown()` is called even if the component is **not** active


### Final Notes

In order to get a better understanding of components architecture you could explore [in-house built components](https://github.com/MitocGroup/recink/tree/master/components)
