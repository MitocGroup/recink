REciNK Component for CNCI
====================================

This is a [REciNK][1] component, which helps you integrate with [Cloud Native CI][2] (aka CNCI)

## Prerequisites

- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK][1]

## Installation

- `npm install -g recink-cnci`

> Note that the component is installed automatically when running `recink component add recink-cnci`

## Configuration

* `.recink.yml` configuration example:

```yaml
$:
  preprocess:
    '$.cnci.token': 'eval'
    '$.cnci.ci.options.user': 'eval'
    '$.cnci.ci.options.token': 'eval'
    '$.cnci.ci.options.jobName': 'eval'
    '$.cnci.ci.options.buildNumber': 'eval'

  cnci:
    token: process.env.CNCI_TOKEN               # Cloud Native CI API token
    ci:                                         # CI configuration
      provider: jenkins                         # CI provider [available: jenkins]
      options:
        user: process.env.JENKINS_USER          # User & token to call Jenkins API
        token: process.env.JENKINS_TOKEN
        domain: jenkins.mitocgroup.com          # Domain [optional, default = 127.0.0.1]
        jobName: process.env.JOB_NAME           # Job name
        buildNumber: process.env.BUILD_NUMBER   # Build number [optional]
```

## Usage

* To parse & analyze `.tfstate` and `.tfplan` files

```bash
recink run terraform -c cnci
```

* To upload CI metadata

```bash
recink run cnci --sync
```

> This should be run in a post-build step

[1]: https://github.com/MitocGroup/recink
[2]: https://www.cloudnativeci.com
