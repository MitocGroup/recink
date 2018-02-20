REciNK Component for E2E
====================================

This is a [REciNK][1] component for End2End testing, build on top of TestCafe.

# Prerequisites

- [x] Git >= v1.x
- [x] Node.js >= v6.x
- [x] NPM >= v3.x
- [x] [REciNK][1]

# Installation

- `npm install -g recink-e2e`

> Note that the component is installed automatically when running `recink component add e2e`


# Configuration

`.recink.yml` configuration:

```yaml
$:
  e2e:
    pattern:                          # Files to include
      - /.+\.e2e\.js$/i
    ignore: ~                         # Files to exclude
    reporter: ~                       # TestCafe framework reporter
    wait:
     interval: 200                    # Interval of running uri checks
     timeout: 15000                   # Timeout to wait for uri's available
     uri:                             # URI's to wait before start running test cases
       - http://google.com/
    screenshot:
      enabled: true                   # Enable screenshots
      take-on-fail: true              # Screenshot page on fail
      path: './screenshots'           # Path to store screenshots
    browsers:
      - chrome                        # Browser to run test
```

# Usage

``` bash
recink run e2e
```

[1]: https://github.com/MitocGroup/recink
