# Short User Guide

In order to use `REciNK`, you have to install it
(see [README.md](https://github.com/MitocGroup/recink/blob/master/README.md))
and configure your GitHub project.


### Configuring GitHub project:

- [Enable Travis](https://docs.travis-ci.com/user/getting-started#To-get-started-with-Travis-CI%3A) for your repository
- Configure `recink`: `recink configure recink`
- Configure [Travis](https://travis-ci.org): `recink configure travis --aws-access-key-id xxx --aws-secret-access-key xxx` 

> See the [Advanced Configuration Guide](https://github.com/MitocGroup/recink/blob/master/docs/advanced-configuration.md)


### Adding [Travis](https://travis-ci.org) Environment Variables

```
recink travis encrypt -x 'EXAMPLE_ENV_VAR=1234' -x 'ANOTHER_EXAMPLE_ENV_VAR=4321'
```

Please note that if your repository is private you have to use [Travis Pro](https://travis-ci.com).
To properly encrypt [Travis variables](https://github.com/MitocGroup/recink/blob/master/bin/commands/configure/helper/travis.js#L7)
you should run the `recink configure travis` command with `--github-token` or `--github-username` and `--github-password`.

> To ensure your [Travis](https://travis-ci.org) configuration is valid use `recink travis lint`


### Running Tests

- Run unit tests: `recink run unit`
- Run end-to-end tests: `recink run e2e`

> If you have to **compile sources** before running tests [see this](https://github.com/MitocGroup/recink/blob/master/docs/compile-es6.md)


### Leveraging The Power of Components

According to the ["Everything is a component" mantra](https://github.com/MitocGroup/recink/blob/master/docs/component-guide.md#before-starting) you have full
control over any single component used by recink, in other words you can disable all components, add some 3'rd part
ones and do whatever makes sense for your setup.

Examples:

- `recink run unit -s npm` Run unit tests with disabled `npm` component
- `recink run unit -s emit -c pagespeed` Run unit tests with disabled `emit` component and additional `pagespeed` component enabled

> Note that any components dependant on the disabled one will be implicit disabled by `REciNK`.
> For example by disabling `npm` component you'll have the `cache` component disabled,
> by disabling `emit`- `test`, `coverage`, `npm` etc. will be implicit disabled!

You may also use the `REciNK` [component registry](https://github.com/MitocGroup/recink/blob/master/docs/component-registry.md) to manage components.


### Reference

- [Sample REciNK configuration](https://github.com/MitocGroup/recink/blob/master/bin/templates/.recink.yml)
- [Sample Travis configuration](https://github.com/MitocGroup/recink/blob/master/bin/templates/.travis.yml)


### Shell Autocompletion

We're using [Caporal](https://github.com/mattallty/Caporal.js) as command line framework.
In order to enable autocompletion see `Caporal`'s [shell auto completion](https://github.com/mattallty/Caporal.js#shell-auto-completion) section
