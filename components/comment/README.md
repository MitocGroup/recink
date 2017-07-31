REciNK Component for commenting things
======================================

This is a [REciNK](https://github.com/MitocGroup/recink) component that submits comments to different backends.

# Prerequisites

- [x] Git >= v1.x
- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK](https://github.com/MitocGroup/recink#installation)

> Use [nvm](https://github.com/creationix/nvm#installation) to install and
manage different versions of Node.js; Ideally, use v8+ for faster performance


# Installation

- `npm install -g recink-comment`

> Note that the component is installed automatically when running `recink component add comment`


# Configuration

`.recink.yml` configuration:

```yaml
$:
  preprocess:
    '$.comment.providers.github.0.token': 'eval'
    # '$.comment.listen': 'eval'
  comment:
    # listen: '`${ process.cwd() }/recink.comment`'     # Listen for file input (including initial content; think "tail -f")
    providers:                                          # Supported providers: github
      github:
        - token: 'process.env.GITHUB_ACCESS_TOKEN'
```

`.travis.yml` configuration:

```yaml
script: 'recink run unit -c recink-comment'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-comment'
```

Or using the registry: 

```yaml
before_install:
  # other before_install scripts...
  - 'recink component add comment'
```

Add the `GITHUB_ACCESS_TOKEN` to `.travis.yml`:

```
recink travis encrypt -x 'GITHUB_ACCESS_TOKEN=1234'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/recink/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable


# Usage

```
GITHUB_ACCESS_TOKEN=1234 recink run unit -c recink-comment
```

# Pushing Messages Using Programatic API

Let's assume you're in a component context (e.g. `pagespeed-component.js`):

```javascript
  /**
   * @param {Emitter} emitter
   * 
   * @returns {Promise}
   */
  run(emitter) {
    const commentComponent = emitter.component('comment');

    return commentComponent 
      ? commentComponent.comment(`Hello from ${ Date() }`) 
      : Promise.resolve();
  } 
```

# Pushing Messages to Input Stream

Let's assume that `~/recink.comment` is the input stream `comment component` is listening to:

```
echo "Test message" >> ~/recink.comment
```

> Note that the initial `~/recink.comment` content would be submitted as a single comment.
