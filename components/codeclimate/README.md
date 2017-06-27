CodeClimate Component
======================

This is a [reCInk](https://github.com/MitocGroup/reCInk) component that submit 
coverage information into [CodeClimate](https://codeclimate.com) backend.

# Prerequisites

- [ ] Ensure `Node.js >=v6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] [Install "reCInk"](https://github.com/MitocGroup/reCInk#installation)
- [ ] Profit?!

# Installation

- `npm install -g recink-codeclimate`

# Configuration

`.recink.yml` configuration:

```
$:
  preprocess:
    '$.codeclimate.token': 'eval'
  codeclimate:
    token: 'process.env.CODECLIMATE_REPO_TOKEN'         # CodeClimate Repo token
    # skip-certificate: true                            # Skip validating server SSL certificate
```

`.travis.yml` configuration:

```
script: 'recink run unit -c recink-codeclimate'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-codeclimate'
```

Add the [CodeClimate Repo Token](https://docs.codeclimate.com/v1.0/docs/test-coverage-troubleshooting-tips#section--should-i-keep-my-test-coverage-token-secret-) to `.travis.yml`:

```
recink travis encrypt -x 'CODECLIMATE_REPO_TOKEN=1234'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/reCInk/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable

# Usage

```
CODECLIMATE_REPO_TOKEN=1234 recink run unit -c recink-codeclimate
```
