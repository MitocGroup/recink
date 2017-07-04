# Compiling sources

Nowadays JavaScript projects could contain lots of `.es6` code, especially `import {} from '...'` and other useful syntax sugar. 

In order to make it compatible with the `REciNK` running on `Node.js v6.x` or even `Node.js v8.x` you have to compile initial sources before running tests. 

This section is dedicated to compiling the `.es6` sources using [Babel](https://babeljs.io) compiler.


### Compile script

Basic `compile-lib.sh` script:

```bash
#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "You must provide library path"
  exit 1
fi

_pwd=$(pwd)
_lib="$1"

# todo: find a smarter fix
# Fixing "spawn sh ENOENT" issue
cd /

REQUIRED_DEPS=("babel-cli" "babel-plugin-add-module-exports" "babel-preset-node6");
NPM_BIN=`which npm`
NPM_GLOBAL_NM=`$NPM_BIN root -g`

echo "Checking babel-* dependencies in $NPM_GLOBAL_NM"

for DEP in ${REQUIRED_DEPS[@]}; do
  if [ ! -d "$NPM_GLOBAL_NM/$DEP" ]; then
    echo "Installing missing $DEP"
    "$NPM_BIN" install -g "$DEP" || (echo "Failed to install $DEP" && exit 1)
    echo "$DEP has been installed"
    echo ""
  fi
done

cd "$_pwd" || (echo "Failed to resume to $_pwd" && exit 1)
cd "$_lib" || (echo "Failed to pwd to lib path $_pwd" && exit 1)
babel lib/ --extensions='.es6' --plugins="$NPM_GLOBAL_NM/babel-plugin-add-module-exports" --presets="$NPM_GLOBAL_NM/babel-preset-node6" --out-dir="lib.compiled" || (echo "Failed to compile $_pwd" && exit 1)
```


The script above is compiling `.es6` files from `lib/` to `.js` files compatible with `Node.js >=v6.x` in `lib.compiled/` folder


### Seting up `package.json`

Use the above `compile-lib.sh` script:

```javascript
"scripts": {
  "compile-travis": "bash compile-lib.sh ."
}
```


### Seting up `.recink.yml`

Ensure `compile-travis` script run:

```yaml
npm:
  scripts:                                                              
    - 'compile-travis'
```
