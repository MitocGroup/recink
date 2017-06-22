run-jst
========

[![NPM Version](https://img.shields.io/npm/v/run-jst.svg?maxAge=0)](https://npmjs.org/package/run-jst)
[![Build Status](https://travis-ci.org/MitocGroup/run-jst.svg?branch=master&maxAge=0)](https://travis-ci.org/MitocGroup/run-jst)
[![Code Climate](https://codeclimate.com/github/MitocGroup/run-jst/badges/gpa.svg?maxAge=0)](https://codeclimate.com/github/MitocGroup/run-jst)
[![API Docs](https://mitocgroup.github.io/run-jst/api/badge.svg?maxAge=0)](https://mitocgroup.github.io/run-jst/api/)

`run-jst` (aka `jst`) is a highly customizable and extremely optimized tests runner
suitable for running tests on big / hybrid / complex projects by adding a simple `.jst.yml` config.

# Motivation

Finding an higly configurable test runner that suits more than a basic js app
is as hard as writing high quality tests. The main reason is getting test runned as fast as possible
with minimal headache possible and extending the runner via components with simple and documented api.

Also Travis integration and caching out of the box ;)

> The project have been started to cover the needs of [Deep Ecosystem](https://github.com/MitocGroup/deep-framework)

# Features

- Easy to [install](https://github.com/MitocGroup/run-jst#installation)/[configure](https://github.com/MitocGroup/run-jst/blob/master/docs/guide.md#configuring-github-project)/[use](https://github.com/MitocGroup/run-jst#usage)
- [Multimodule](https://github.com/MitocGroup/deep-framework/blob/master/.jst.yml#L58) support with consolidated coverage
- [Travis](https://travis-ci.org) support
- [Coverage](https://istanbul.js.org) support
- [NPM](https://www.npmjs.com) support with packages global/local overwrites (including custom scripts execution)
- [AWS S3](https://aws.amazon.com/s3/) storage driver support
- [Caching](https://github.com/MitocGroup/run-jst/blob/master/bin/templates/.jst.yml#L10) support
- [Easily extendable](https://github.com/MitocGroup/run-jst#components-inhouse--3rd-party)
- [Easily debuggable](https://github.com/MitocGroup/run-jst#debugging)
- [Well documented](https://github.com/MitocGroup/run-jst#documentation)
- To be continued...

> [Mocha](http://mochajs.org) is used as test framework for `unit` testing

> [TestCafe](https://devexpress.github.io/testcafe/) is used as test framework for `e2e` testing

# Prerequisites

- [ ] Ensure `Node.js >=v6.x` is installed (We recommend using `nvm` https://github.com/creationix/nvm#installation)
- [ ] Profit?!

> We'd recommend installing Node.js v8.x to speedup things.

# Installation

`npm install -g run-jst`

# Getting Started

Check out the [User Guide](https://github.com/MitocGroup/run-jst/blob/master/docs/guide.md#configuring-github-project)

# Usage

`jst --help` Show help

`jst configure jst` Configure run-jst

`jst run unit` Run unit tests

# Debugging

In order start debugging TestCafe [read this](http://devexpress.github.io/testcafe/documentation/test-api/debugging.html).

In case you are using the [Nighmare](https://github.com/ryx/testcafe-browser-provider-nightmare) browser please refer to [this link](https://github.com/ryx/testcafe-browser-provider-nightmare#debugging).

> Note that [Nighmare](https://github.com/ryx/testcafe-browser-provider-nightmare) browser is used as default browser when none specified.

# CI Platforms supported

- [x] [Travis](https://travis-ci.org)
- [x] [Travis Pro](https://travis-ci.com)

# Documentation

- [x] [Quick Start Guide](https://github.com/MitocGroup/run-jst/blob/master/docs/guide.md)
- [x] [Crafting Components](https://github.com/MitocGroup/run-jst/blob/master/docs/component-guide.md)
- [x] [Api Docs](https://mitocgroup.github.io/run-jst/api/identifiers.html)
- [x] [Module Diagram](https://mitocgroup.github.io/run-jst/module-diagram.html)

# Components (inhouse + 3'rd party)

- [CodeClimate Integration](https://github.com/MitocGroup/run-jst/blob/master/components/codeclimate/README.md)

> [Navigate here](https://github.com/MitocGroup/run-jst/tree/master/components) to see all inhouse components

# Projects using run-jst

- [Deep Framework](https://github.com/MitocGroup/deep-framework)

> To add you project to this list please open a PR ;)

# Roadmap

- [x] Implement smart cache invalidation
- [x] Add support for external components
- [x] Add support for fully automated `Travis` configuration 
- [x] Add support for End-to-End tests
- [ ] Add support for different CI platforms
- [ ] Add component development guide

# Sponsors

This repository is being sponsored by:

- [Mitoc Group](https://www.mitocgroup.com)
- [AdTechMedia](https://www.adtechmedia.io)

# License

run-jst is released under the MIT license.

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

