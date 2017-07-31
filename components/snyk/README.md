REciNK Component for Snyk
=========================

This is a [REciNK](https://github.com/MitocGroup/recink) component that detects vulnerable
dependencies according to `package.json` submitted to [Snyk.io](https://snyk.io) backend.


# Prerequisites

- [x] Git >= v1.x
- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK](https://github.com/MitocGroup/recink#installation)

> Use [nvm](https://github.com/creationix/nvm#installation) to install and
manage different versions of Node.js; Ideally, use v8+ for faster performance


# Installation

- `npm install -g recink-snyk`

> Note that the component is installed automatically when running `recink component add snyk`


# Configuration

`.recink.yml` configuration:

```yaml
$:
  preprocess:
    '$.snyk.token': 'eval'
    # '$.snyk.reporters.github.0.token': 'eval'
  snyk:
    token: 'process.env.SNYK_API_TOKEN'               # Snyk.io API token
    # actionable: true                                # Show actionable items
    # dev: false                                      # Analyze 'devDependencies'
    # reporters:                                      # Customize Reporters (available: text, github)
    #   text: ~
    #   github:
    #     - token: 'process.env.GITHUB_ACCESS_TOKEN'
    # fail:                                     
    #   enabled: false                                # Fail on issues found
    #   severity: 'medium'                            # Minimal severity to handle (available: low, medium, high)
```

`.travis.yml` configuration:

```yaml
script: 'recink run snyk'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-snyk'
```

Or using the registry: 

```yaml
before_install:
  # other before_install scripts...
  - 'recink component add snyk'
```

Add the [Snyk.io API Token](https://snyk.io/docs/quick-start/#authentication) to `.travis.yml`:

```
recink travis encrypt -x 'SNYK_API_TOKEN=1234' -x 'GITHUB_ACCESS_TOKEN=1234'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/recink/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable


# Usage

```
GITHUB_ACCESS_TOKEN=1234 SNYK_API_TOKEN=1234 recink run snyk
```


# Gotchas

Please note that if you are using `GitHub` reporter outside 
[Travis](https://travis-ci.org) environment it does nothing but trigger a warn.
