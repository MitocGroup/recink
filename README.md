Rethink (reCInk) Continuous Integration for JavaScript Applications 
===================================================================

[![NPM Version](https://img.shields.io/npm/v/recink.svg?maxAge=0)](https://npmjs.org/package/recink)
[![Build Status](https://travis-ci.org/MitocGroup/reCInk.svg?branch=master&maxAge=0)](https://travis-ci.org/MitocGroup/reCInk)
[![Code Climate](https://codeclimate.com/github/MitocGroup/reCInk/badges/gpa.svg?maxAge=0)](https://codeclimate.com/github/MitocGroup/reCInk)
[![API Docs](https://mitocgroup.github.io/recink/api/badge.svg?maxAge=0)](https://mitocgroup.github.io/recink/api/)

`reCInk` (former `run-jst`) is a highly customizable and extremely optimized tests runner
suitable for running tests on big / hybrid / complex projects by adding a simple `.recink.yml` config.

# Motivation

Finding an highly configurable test runner that suits for more than a basic js app
is as hard as writing high quality tests :bowtie:. The main reason is getting test running as fast as possible
with a minimal headache possible and extending the runner via components using a simple and documented api.

Also CI integration and caching out of the box :wink:

> The project has been started to cover the needs of [Deep Ecosystem](https://github.com/MitocGroup/deep-framework)

# Features

- Easy to [install](https://github.com/MitocGroup/reCInk#installation)/[configure](https://github.com/MitocGroup/reCInk/blob/master/docs/guide.md#configuring-github-project)/[use](https://github.com/MitocGroup/reCInk#usage)
- [Multimodule](https://github.com/MitocGroup/deep-framework/blob/master/.recink.yml#L58) support with consolidated coverage
- [Travis](https://travis-ci.org) support
- [Coverage](https://istanbul.js.org) support
- [NPM](https://www.npmjs.com) support with packages global/local overwrites (including custom scripts execution)
- [AWS S3](https://aws.amazon.com/s3/) storage driver support
- [Caching](https://github.com/MitocGroup/reCInk/blob/master/bin/templates/.recink.yml#L10) support
- [Easily extendable](https://github.com/MitocGroup/reCInk#components-inhouse--3rd-party)
- [Easily debuggable](https://github.com/MitocGroup/reCInk#debugging)
- [Well documented](https://github.com/MitocGroup/reCInk#documentation)
- To be continued...

> [Mocha](http://mochajs.org) is used as test framework for `unit` testing

> [TestCafe](https://devexpress.github.io/testcafe/) is used as test framework for `e2e` testing

# Prerequisites

- [ ] Ensure `Node.js >=v6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] Profit?!

> We'd recommend installing Node.js v8.x to speedup things.

# Installation

`npm install -g recink`

# Getting Started

Check out the [User Guide](https://github.com/MitocGroup/reCInk/blob/master/docs/guide.md#configuring-github-project)

# Usage

`recink --help` Show help

`recink configure recink` Configure `reCInk`

`recink run unit` Run unit tests

`recink run e2e` Run end-to-end tests

# Debugging

In order start debugging TestCafe [read this](http://devexpress.github.io/testcafe/documentation/test-api/debugging.html).

In case you are using the [Nighmare](https://github.com/ryx/testcafe-browser-provider-nightmare) browser please refer to [this link](https://github.com/ryx/testcafe-browser-provider-nightmare#debugging).

> Note that [Nighmare](https://github.com/ryx/testcafe-browser-provider-nightmare) browser is used as default browser when none specified.

# CI Platforms supported

- [x] [Travis](https://travis-ci.org)
- [x] [Travis Pro](https://travis-ci.com)

# Documentation

- [x] [Quick Start Guide](https://github.com/MitocGroup/reCInk/blob/master/docs/guide.md)
- [x] [Crafting Components](https://github.com/MitocGroup/reCInk/blob/master/docs/component-guide.md)
- [x] [Api Docs](https://mitocgroup.github.io/recink/api/identifiers.html)
- [x] [Module Diagram](https://mitocgroup.github.io/recink/module-diagram.html)
- [x] [FAQ](https://github.com/MitocGroup/reCInk/blob/master/docs/faq.md)

# Components (inhouse + 3'rd party)

- :house: [CodeClimate](https://github.com/MitocGroup/reCInk/blob/master/components/codeclimate/README.md)
- :house: [Snyk.io](https://github.com/MitocGroup/reCInk/blob/master/components/snyk/README.md)
- :house: [Google PageSpeed](https://github.com/MitocGroup/reCInk/blob/master/components/google-pagespeed/README.md)

> [Navigate here](https://github.com/MitocGroup/reCInk/tree/master/components) to see all inhouse components

# Projects using "reCInk"

- [Deep Framework](https://github.com/MitocGroup/deep-framework)

> To add you project to this list please open a PR ;)

# Roadmap

- [x] Implement smart cache invalidation
- [x] Add support for external components
- [x] Add support for fully automated `Travis` configuration 
- [x] Add support for End-to-End tests
- [ ] Add support for different CI platforms
- [ ] Add component development guide
- [ ] Add unit tests for critical functionality
- [ ] Craft a cool logo for the project :alien:

# Sponsors

This repository is being sponsored by:

- [Mitoc Group](https://www.mitocgroup.com)
- [AdTechMedia](https://www.adtechmedia.io)

# License

recink is released under the MIT license.

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
