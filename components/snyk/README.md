Snyk.io Component
======================

This is a [reCInk](https://github.com/MitocGroup/reCInk) component that detects vulnerable
dependencies according to `package.json` submitted to [Snyk.io](https://snyk.io) backend.

# Prerequisites

- [ ] Ensure `Node.js >=v6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] [Install "reCInk"](https://github.com/MitocGroup/reCInk#installation)
- [ ] Profit?!

# Installation

- `npm install -g recink-snyk`

# Configuration

`.recink.yml` configuration:

```
$:
  preprocess:
    '$.snyk.token': 'eval'
  snyk:
    token: 'process.env.SNYK_API_TOKEN'         # Snyk.io API token
    # actionable: true                          # Show actionable items
    # dev: false                                # Analyze 'devDependencies'
```

`.travis.yml` configuration:

```
script: 'recink run unit -c recink-snyk'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-snyk'
```

Add the [Snyk.io API Token](https://snyk.io/docs/quick-start/#authentication) to `.travis.yml`:

```
recink travis encrypt -x 'SNYK_API_TOKEN=1234'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/reCInk/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable

# Usage

```
SNYK_API_TOKEN=1234 recink run unit -c recink-snyk
```
