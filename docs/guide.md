# Short User Guide

In order to get started you have to install `Deepstiny` (see [README.md](https://github.com/MitocGroup/deepstiny/blob/master/README.md))
and configure your project.

### Configure repository:

- Configure `dps`: `dps configure dps`
- Configure [Travis](https://travis-ci.org): `dps configure travis` 

> To ensure your [Travis](https://travis-ci.org) configuration is valid use `dps lint travis`
> [Sample configuration](https://github.com/MitocGroup/deepstiny/blob/master/bin/templates/.dps.yml)

### Running tests

- Run unit tests: `dps run unit`
- Run end-to-end tests: `dps run e2e` (Not yet implemented!)

### Shell autocompletion

We're using [Caporal](https://github.com/mattallty/Caporal.js) as command line framework.
In order to enable autocompletion see `Caporal`'s [shell auto completion](https://github.com/mattallty/Caporal.js#shell-auto-completion) section

