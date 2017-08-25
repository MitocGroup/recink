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

# Travis

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
