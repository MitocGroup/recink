#!/usr/bin/env bash

### License MIT
### 2017 AdTechMedia.io (c)
### Author: AlexanderC <acucer@mitocgroup.com>

function fail () {
  echo >&2 "[FAILED] $1!"
  exit 1
}

function require_clean_work_tree () {
  # Update the index
  git update-index -q --ignore-submodules --refresh
  err=0

  # Disallow unstaged changes in the working tree
  if ! git diff-files --quiet --ignore-submodules --
  then
    echo >&2 "You have unstaged changes."
    git diff-files --name-status -r --ignore-submodules -- >&2
    err=1
  fi

  # Disallow uncommitted changes in the index
  if ! git diff-index --cached --quiet HEAD --ignore-submodules --
  then
    echo >&2 "Your index contains uncommitted changes."
    git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2
    err=1
  fi

  if [ $err = 1 ]
  then
    fail "Pre-checking git status"
  fi
}

function validate_input () {
  if [ -z "$1" ]
  then
    fail "Please provide a valid semver function (https://github.com/npm/node-semver#functions)"
  fi
  
  if [ -z "$2" ]
  then
    fail "Please provide a component name"
  fi
}

validate_input "$@"
require_clean_work_tree
cd "components/$2"                                                                                              || fail "No such component $2 found"
rm -rf node_modules                                                                                             || fail "Cleaning up recink-$2 node_modules"
npm install --no-shrinkwrap                                                                                     || fail "Installing recink-$2 dependencies"
npm version "$1" --no-git-tag-version                                                                           || fail "Updating $1 version of recink-$2 package"
npm publish                                                                                                     || fail "Publishing recink-$2 package on npmjs.com"
cd ../../
(git diff-files --quiet --ignore-submodules -- || (git add . && git commit -a -m"Publish recink-$2 package on npmjs.com"))
git push

echo '[OK] Done.'
