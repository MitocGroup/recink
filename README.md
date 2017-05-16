# Deepstiny

[![Api Docs](https://mitocgroup.github.io/deepstiny/api/badge.svg)](https://mitocgroup.github.io/deepstiny/api/)

`Deepstiny` (aka `dps`) is a highly optinionated and extremely optimized test runner
suitable for running tests on big/hybrid/complex projects by adding a simply `.dps.yml`
configuration to rule them all.

# Motivation

Finding an higly configurable test runner that suits more than a basic js app
is as hard as writing high quality tests. The main reason is getting test runned as fast as possible
with minimal headache possible and extending the runner via components with simple and documented api.

Also Travis integration and caching out of the box ;)

# Prerequisites

- [ ] Ensure `Node.js 6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] Profit?!

# Installation

`npm install -g deepstiny`

# Configuration

Check out [User Guide](https://github.com/MitocGroup/deepstiny/blob/master/docs/guide.md#configure-repository)

# Usage

`dps --help` Show help

`dps configure dps` Configure Deepstiny

`dps run unit` Run unit tests

# Documentation

- [x] User Guide - https://github.com/MitocGroup/deepstiny/blob/master/docs/guide.md
- [x] Api Docs - https://mitocgroup.github.io/deepstiny/api/
- [ ] Dependencies Diagram

# License

Deepstiny is released under the MIT license.

Copyright (c) 2017 Mitoc Group Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

