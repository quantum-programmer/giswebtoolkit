#!/bin/bash

DIR="$( cd "$( dirname "$0" )" && pwd )"
cd $DIR
CURRENT_DIR=$(dirname "$CURRENT_DIR_UNLINKED")
BUILDNUMBER=$(cat "$CURRENT_DIR/BUILDNUMBER")

GWTK_VERSION="$(grep version "$CURRENT_DIR/package.json" | head -n 1 | cut -d ':' -f2 | grep -oE '[0-9\.]+')"
GWTK_NAME="$(grep name "$CURRENT_DIR/package.json" | head -n 1 | cut -d ':' -f2 | grep -oE '(\w+)')"

export VUE_CLI_SERVICE_CONFIG_PATH=vue.config.build.js&& npx vue-cli-service build --formats umd-min --target lib --filename $GWTK_NAME-$GWTK_VERSION-$BUILDNUMBER ./example/MapVue.ts
cp -r release/. gwtk-app

TEMPLATE='MapVue-6.23.0-1'
REPLACE_VALUE=$GWTK_NAME-$GWTK_VERSION-$BUILDNUMBER
sed -i "s/$TEMPLATE/$REPLACE_VALUE/g" gwtk-app/index.html

rm -r release/
