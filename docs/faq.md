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