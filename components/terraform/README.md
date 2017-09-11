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
- `npm install -g recink-comment` *Only necessary when GitHub commenting support needed*

> Note that the component is installed automatically when running `recink component add terraform`


# How it works

[REciNK](https://github.com/MitocGroup/recink) is looking into configured modules (@see [example](https://github.com/MitocGroup/recink/components/terraform/example)) and is listening for triggered
ones having a `main.tf` file inside (e.g. `./example/main.tf`)


# Configuration

`.recink.yml` configuration:

```yaml
$:
  preprocess:
    '$.terraform.vars.sample': 'eval'
  terraform:
#   resource-dirname: '.resource'                                           # Resource dirname relative to the module root directory (default ".resource")
#   binary: './bin/terraform'                                               # Path to Terraform binary (default "./bin/terraform")
    init: true                                                              # Initialize Terraform setup (default "true")
    plan: true                                                              # Terraform validate .tf and make a provision plan (default "true")
    apply: false                                                            # Terraform provision infrastructure (default "false")
    vars:                                                                   # Terraform variables (@see https://www.terraform.io/docs/configuration/variables.html)
      sample: 'process.env.SAMPLE_VAR'
  comment:
    providers:                                                              # Supported providers: github
      github:
        - token: 'process.env.GITHUB_ACCESS_TOKEN'
```

`.travis.yml` configuration:

```yaml
script: 'recink run terraform -c comment'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-terraform'
  - 'npm install -g recink-comment'
```

Add the `SAMPLE_VAR` and `GITHUB_ACCESS_TOKEN` to `.travis.yml`:

```
recink travis encrypt -x 'SAMPLE_VAR="sample value"' -x 'GITHUB_ACCESS_TOKEN=xxxxxxx'
```

> If you are using [Travis Pro](https://travis-ci.com/) [read this guide](https://github.com/MitocGroup/recink/blob/master/docs/guide.md#configuring-github-project) to properly encrypt the environment variable


# Usage

```
SAMPLE_VAR="sample value" GITHUB_ACCESS_TOKEN=xxxxxxx recink run terraform
```
