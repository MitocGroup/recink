Snyk.io Component
======================

This is a [run-jst](https://github.com/MitocGroup/run-jst) component that detects vulnerable
dependencies according to `package.json` submitted to [Snyk.io](https://snyk.io) backend.

# Prerequisites

- [ ] Ensure `Node.js >=v6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] [Install "run-jst"](https://github.com/MitocGroup/run-jst#installation)
- [ ] Profit?!

# Installation

- `npm install -g run-jst-snyk`

# Configuration

`.jst.yml` configuration:

```
$:
  preprocess:
    '$.snyk.token': 'eval'
  snyk:
    token: 'process.env.JST_SNYK_API_TOKEN'     # Snyk.io API token
    # actionable: true                          # Show actionable items
    # dev: false                                # Analyze 'devDependencies'
```

`.travis.yml` configuration:

```
script: 'jst run unit -c run-jst-snyk'  
before_install:
  # other before_install scripts...
  - 'npm install -g run-jst-snyk'
```

Add the [Snyk.io API Token](https://snyk.io/docs/quick-start/#authentication) to `.travis.yml`:

```
jst travis encrypt -x 'JST_SNYK_API_TOKEN=1234'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/run-jst/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable

# Usage

```
JST_SNYK_API_TOKEN=1234 jst run unit -c run-jst-snyk
```
