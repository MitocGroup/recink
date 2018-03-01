REciNK Component for CNCI
====================================

This is a [REciNK](https://github.com/MitocGroup/recink) component for Cnci.

# Prerequisites

- [x] Git >= v1.x
- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK](https://github.com/MitocGroup/recink#installation)

> Use [nvm](https://github.com/creationix/nvm#installation) to install and
manage different versions of Node.js; Ideally, use v8+ for faster performance


# Installation

- `npm install -g recink-cnci`

> Note that the component is installed automatically when running `recink component add cnci`


# Configuration

`.recink.yml` configuration:

```yaml
$:
  preprocess:
    '$.cnci.name': 'eval'
  cnci:
    name: 'process.env.CNCI'      # Name to output
```

`.travis.yml` configuration:

```yaml
script: 'recink run unit -c cnci'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-cnci'
```

Or using the registry: 

```yaml
before_install:
  # other before_install scripts...
  - 'recink component add cnci'
```

Add the `CNCI` to `.travis.yml`:

```
recink travis encrypt -x 'CNCI="John"'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/recink/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable


# Usage

```
CNCI="John" recink run unit -c cnci
```

Or the generic way:

```
CNCI="John" recink run cnci
```
