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

> Note that the component is installed automatically when running `recink component add pagespeed`

# Configuration

`.recink.yml` configuration:

```yaml 
$:
  pagespeed:
    uri:                                                                      # URIs to analyze
      - https://www.example.com
    # strategy: desktop                                                       # Available: desktop, mobile
    # filter-third-party: true                                                # Filter 3'rd party assets
    # locale: en                                                              # @see https://developers.google.com/speed/docs/insights/languagesx
    # reporters:                                                              # Customize Reporters (available: text, summary)
    #   summary: ~
    #   text: 
    #     - minimal: true                                                     # Skip showing detailed statistics
    # compare:
    #   negative-delta: 3                                                     # Compare coverage info and if negative delta is more than X fail (0.01-100.00)
    #   storage:                                              
    #     driver: 's3'                                                        # Available drivers: s3, volative
    #     options:
    #       - 's3://travis-metadata/pagespeed/sample-repo'                    # S3 storage directory
    #       -                                                                 # S3 storage options
    #         region: 'process.env.AWS_DEFAULT_REGION'
    #         accessKeyId: 'process.env.AWS_ACCESS_KEY_ID'
    #         secretAccessKey: 'process.env.AWS_SECRET_ACCESS_KEY'
```

`.travis.yml` configuration:

```yaml
script: 'recink run pagespeed'
before_install:
  # other before_install scripts...
  - 'npm install -g recink-pagespeed'
```

Or using the registry: 

```yaml
before_install:
  # other before_install scripts...
  - 'recink component add pagespeed'
```


# Usage

```
recink run pagespeed
```
