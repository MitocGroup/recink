# Short User Guide

In order to use `Deepstiny` you have to install it (see [README.md](https://github.com/MitocGroup/deepstiny/blob/master/README.md))
and configure your GitHub project.

### Configuring GitHub project:

- [Enable Travis](https://docs.travis-ci.com/user/getting-started#To-get-started-with-Travis-CI%3A) for your repository
- Configure `dps`: `dps configure dps`
- Configure [Travis](https://travis-ci.org): `dps configure travis --aws-access-key-id xxx --aws-secret-access-key xxx` 

Please note that if your repository is private you have to use [Travis Pro](https://travis-ci.com).
To properly encrypt [Travis variables](https://github.com/MitocGroup/deepstiny/blob/master/bin/commands/configure/helper/travis-vars.js#L3) 
you should run the `dps configure travis` command with `--github-token` or `--github-username` and `--github-password`.

> To ensure your [Travis](https://travis-ci.org) configuration is valid use `dps lint travis`
> [Sample configuration](https://github.com/MitocGroup/deepstiny/blob/master/bin/templates/.dps.yml)
> [Travis variables](https://github.com/MitocGroup/deepstiny/blob/master/bin/commands/configure/helper/travis-vars.js#L3)

### Running tests

- Run unit tests: `dps run unit`
- Run end-to-end tests: `dps run e2e` (Not yet implemented!)

### Shell autocompletion

We're using [Caporal](https://github.com/mattallty/Caporal.js) as command line framework.
In order to enable autocompletion see `Caporal`'s [shell auto completion](https://github.com/mattallty/Caporal.js#shell-auto-completion) section
