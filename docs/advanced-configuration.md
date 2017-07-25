# Advanced Configuration Guide

This section shows how to fine tune the [default REciNK configuration](https://github.com/MitocGroup/recink/blob/master/bin/templates/.recink.yml).

### Using preprocessors

Let assume we have the following configuration and we want to read `MY_ENV` value from environment variables:

```yaml
$:
  mycomponent:
    environment: 'process.env.MY_ENV'
```

In order to assign a preprocessor to the desired value we have to setup `preprocess`:

```yaml
$:
  preprocess:
    '$.mymodule.environment': 'eval'    # <--- assigned preprocessor
  mycomponent:
    environment: 'process.env.MY_ENV'   # <--- value reference
```

In order to test it you can use: `MY_ENV=dev recink run unit -c mycomponent`

#### The following preprocessors are implemented:

- `eval` Evaluating the configured value as a JavaScript expression using [eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)

