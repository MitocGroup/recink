Google PageSpeed Component
==========================

This is a [REciNK](https://github.com/MitocGroup/recink) component to
analyze and optimize your site following web best practices using [Google PageSpeed](https://developers.google.com/speed/pagespeed/).

# Prerequisites

- [ ] Ensure `Node.js >=v6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] [Install "REciNK"](https://github.com/MitocGroup/recink#installation)
- [ ] Profit?!

# Installation

- `npm install -g recink-google-pagespeed`

# Configuration

`.recink.yml` configuration:

```
$:
  google-pagespeed:
    uri:                              # URIs to analyze
      - https://www.example.com
    # strategy: desktop               # Available: desktop, mobile
    # filter-third-party: true        # Filter 3'rd party assets
    # locale: en                      # @see https://developers.google.com/speed/docs/insights/languagesx
```

`.travis.yml` configuration:

```
script: 'recink run unit -c recink-google-pagespeed'  
before_install:
  # other before_install scripts...
  - 'npm install -g recink-google-pagespeed'
```

# Usage

```
recink run unit -c recink-google-pagespeed
```
