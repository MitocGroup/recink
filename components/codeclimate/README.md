REciNK Component for CodeClimate
================================

This is a [REciNK](https://github.com/MitocGroup/recink) component that submit
coverage information into [CodeClimate](https://codeclimate.com) backend.


# Prerequisites

- [x] Git >= v1.x
- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK](https://github.com/MitocGroup/recink#installation)

> Use [nvm](https://github.com/creationix/nvm#installation) to install and
manage different versions of Node.js; Ideally, use v8+ for faster performance


# Installation

- `npm install -g recink-codeclimate`

> Note that the component is installed automatically when running `recink component add codeclimate`


# Configuration

`.recink.yml` configuration:

```yaml
$:
  preprocess:
    '$.codeclimate.token': 'eval'
  codeclimate:
    token: 'process.env.CODECLIMATE_REPO_TOKEN'         # CodeClimate Repo token
    # skip-certificate: true                            # Skip validating server SSL certificate
```

`.travis.yml` configuration:

```yaml
script: 'recink run unit -c codeclimate'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-codeclimate'
```

Or using the registry: 

```yaml
before_install:
  # other before_install scripts...
  - 'recink component add codeclimate'
```

Add the [CodeClimate Repo Token](https://docs.codeclimate.com/v1.0/docs/test-coverage-troubleshooting-tips#section--should-i-keep-my-test-coverage-token-secret-) to `.travis.yml`:

```
recink travis encrypt -x 'CODECLIMATE_REPO_TOKEN=1234'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/recink/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable


# Usage

```
CODECLIMATE_REPO_TOKEN=1234 recink run unit -c recink-codeclimate
```
