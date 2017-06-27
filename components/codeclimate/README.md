CodeClimate Component
======================

This is a [run-jst](https://github.com/MitocGroup/run-jst) component that submit 
coverage information into [CodeClimate](https://codeclimate.com) backend.

# Prerequisites

- [ ] Ensure `Node.js >=v6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] [Install "run-jst"](https://github.com/MitocGroup/run-jst#installation)
- [ ] Profit?!

# Installation

- `npm install -g run-jst-codeclimate`

# Configuration

`.jst.yml` configuration:

```
$:
  preprocess:
    '$.codeclimate.token': 'eval'
  codeclimate:
    token: 'process.env.JST_CODECLIMATE_REPO_TOKEN'     # CodeClimate Repo token
    # skip-certificate: true                            # Skip validating server SSL certificate
```

`.travis.yml` configuration:

```
script: 'jst run unit -c run-jst-codeclimate'  
before_install:
  # other before_install scripts...
  - 'npm install -g run-jst-codeclimate'
```

Add the [CodeClimate Repo Token](https://docs.codeclimate.com/v1.0/docs/test-coverage-troubleshooting-tips#section--should-i-keep-my-test-coverage-token-secret-) to `.travis.yml`:

```
jst travis encrypt -x 'JST_CODECLIMATE_REPO_TOKEN=1234'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/run-jst/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable

# Usage

```
JST_CODECLIMATE_REPO_TOKEN=1234 jst run unit -c run-jst-codeclimate
```
