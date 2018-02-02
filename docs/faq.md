Frequently asked questions
==========================

Frequently asked questions (FAQ) are listed questions and answers, 
all supposed to be commonly asked in some context, 
and pertaining to a particular topic.


# Configuration

Q: _Why am I getting `not a Travis user` message when running  `recink travis encrypt --github-token xxx` while configuring [Travis Pro](https://travis-ci.com)?_
  
A: Most probably the provided `--github-token` is invalid. Please check if it exists and is not disabled.

___

Q: _How can I configure parameters `eval` preprocessor to handle an array of values instead of specifying each value separately (e.g. `$.pagespeed.url.0`, `$.pagespeed.url.1` ... `$.pagespeed.url.N`)?_

A: As the `eval` preprocessor evaluates `Node.js` code you can use an **yaml text block** to achieve this, e.g.:

```yaml
$:
  preprocess:
    '$.pagespeed.uri': 'eval' # By adding this an array of strings is assigned to the "pagespeed.uri" property
  pagespeed:
    uri: |
      [ '', 'contact', 'blog' ].map(path => `${process.env.HOST}/${path}`)
```

> Make sure you have set the `HOST` [environment variable](https://github.com/MitocGroup/recink/blob/master/docs/guide.md#adding-travis-environment-variables)


# Travis

Q: _I am getting the following error when running e2e test suites in `Travis`: "Was unable to open the browser "puppeteer:" due to error. Error: Failed to launch chrome!". How can i fix it?_

A: Make sure you've set `dist: trusty` in `travis.yml`, e.g.:

```yaml
dist: trusty
```

___

Q: _Tests failing when using Nightmare browser for e2e test suites in `Travis`. How can i fix it?_

A: Make sure you've `xvfb` up and running to have the X instance virtualized for non headless browsers, e.g.:

```yaml
  addons:
    apt:
      packages:
        - xvfb
  install:
    - "export DISPLAY=':99.0'"
    - "Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &"
```

# Runner

Q: _How to run modules partially?_

A: Let's assume that we use following config:

```yaml
# Config
$:
  preprocess:
    ...
  emit:
    ...
  test:
    ...

# List of application modules
lib:
  root: 'lib'
  dependencies: ~
api:
  root: 'api'
  dependencies: ~
core:
  root: 'core'
  dependencies: ~
```

And you want to run only `api` module - just use `--exclude-modules`/`--include-modules` option


```bash
recink run unit --exclude-modules="lib, core"
```

or

```bash
recink run unit --include-modules="api"
```

___

Q: _How can I overwrite parameters?_

A: Let's assume that we use following config:

```yaml
$:
  preprocess:
    ...
  pagespeed:
    uri: 'www.example.com'
```

We can overwrite it like this:

```bash
recink run unit --custom-config='{"$.pagespeed.uri":"www-test.example.com"}'
```

___

Q: _How can I pass list of parameters?_

A: You can pass it like this:

```bash
recink run terraform --tf-vars="list.0:item_1, list.1:item_2, list.2:item_3"
```

And you will receive:

```javascript
{
  list: [
    'item_1',
    'item_2',
    'item_3' 
  ]
}
```

___

Q: _How can I parse terraform show output?_

A: You can save terraform show output into a file just passing `save-show-output` parameter and parse it later:

```bash
recink run terraform --custom-config="<module-name>.terraform.save-show-output":"./show-output.txt"
```

___
Q: _How can I configure terraform to cache .ftplan & .tfstate?_

A: You can do it the same way as cache component:

```yaml
$:
  terraform:
    resource: '.resource'
    binary: './bin/terraform'
    cache:
      options:
        - 's3://bucket/name/space'
        -
          region: '<region>'
          accessKeyId: '<key>'
          secretAccessKey: '<secret>'
          
iam:
  root: './iam'
  terraform:
    cache: true
    plan: true
    apply: false
    destroy: false
    test:
      apply: './iam/index.e2e.js'
```
