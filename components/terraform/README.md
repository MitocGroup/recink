REciNK Component for Terraform
====================================

This is a [REciNK](https://github.com/MitocGroup/recink) component for [Terraform](https://www.terraform.io).

# Prerequisites

- [x] Git >= v1.x
- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK](https://github.com/MitocGroup/recink#installation)

> Use [nvm](https://github.com/creationix/nvm#installation) to install and
manage different versions of Node.js; Ideally, use v8+ for faster performance


# Installation

- `npm install -g recink-terraform`

> Note that the component is installed automatically when running `recink component add terraform`


# Configuration

`.recink.yml` configuration:

```yaml
$:
  preprocess:
    '$.terraform.name': 'eval'
  terraform:
    name: 'process.env.TERRAFORM'      # Name to output
```

`.travis.yml` configuration:

```yaml
script: 'recink run unit -c terraform'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-terraform'
```

Or using the registry: 

```yaml
before_install:
  # other before_install scripts...
  - 'recink component add terraform'
```

Add the `TERRAFORM` to `.travis.yml`:

```
recink travis encrypt -x 'TERRAFORM="John"'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/recink/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable


# Usage

```
TERRAFORM="John" recink run unit -c terraform
```

Or the generic way:

```
TERRAFORM="John" recink run terraform
```
