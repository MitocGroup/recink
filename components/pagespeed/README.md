REciNK Component for PageSpeed
==============================

This is a [REciNK](https://github.com/MitocGroup/recink) component to
analyze and optimize your website or webapp following best practices from
[Google PageSpeed](https://developers.google.com/speed/pagespeed/).


# Prerequisites

- [x] Git >= v1.x
- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK](https://github.com/MitocGroup/recink#installation)

> Use [nvm](https://github.com/creationix/nvm#installation) to install and
manage different versions of Node.js; Ideally, use v8+ for faster performance


# Installation

- `npm install -g recink-pagespeed`

> Note that the component is installed automatically when running `recink add pagespeed`

# Configuration

`.recink.yml` configuration:

```yaml
$:
  pagespeed:
    uri:                              # URIs to analyze
      - https://www.example.com
    # strategy: desktop               # Available: desktop, mobile
    # filter-third-party: true        # Filter 3'rd party assets
    # locale: en                      # @see https://developers.google.com/speed/docs/insights/languagesx
```

`.travis.yml` configuration:

```yaml
script: 'recink run unit -c recink-pagespeed'
before_install:
  # other before_install scripts...
  - 'npm install -g recink-pagespeed'
```

Or using the registry: 

```yaml
before_install:
  # other before_install scripts...
  - 'recink add pagespeed'
```


# Usage

```
recink run unit -c recink-pagespeed
```
