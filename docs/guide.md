# Short User Guide

In order to use `run-jst` you have to install it (see [README.md](https://github.com/MitocGroup/run-jst/blob/master/README.md))
and configure your GitHub project.

### Configuring GitHub project:

- [Enable Travis](https://docs.travis-ci.com/user/getting-started#To-get-started-with-Travis-CI%3A) for your repository
- Configure `jst`: `jst configure jst`
- Configure [Travis](https://travis-ci.org): `jst configure travis --aws-access-key-id xxx --aws-secret-access-key xxx` 

Please note that if your repository is private you have to use [Travis Pro](https://travis-ci.com).
To properly encrypt [Travis variables](https://github.com/MitocGroup/run-jst/blob/master/bin/commands/configure/helper/travis.js#L7) 
you should run the `jst configure travis` command with `--github-token` or `--github-username` and `--github-password`.

> To ensure your [Travis](https://travis-ci.org) configuration is valid use `jst lint travis`

### Running tests

- Run unit tests: `jst run unit`
- Run end-to-end tests: `jst run e2e` (Not yet implemented!)

#### Reference

- [Sample configuration](https://github.com/MitocGroup/run-jst/blob/master/bin/templates/.jst.yml)
- [Travis variables](https://github.com/MitocGroup/run-jst/blob/master/bin/commands/configure/helper/travis.js#L7)

### Shell autocompletion

We're using [Caporal](https://github.com/mattallty/Caporal.js) as command line framework.
In order to enable autocompletion see `Caporal`'s [shell auto completion](https://github.com/mattallty/Caporal.js#shell-auto-completion) section
