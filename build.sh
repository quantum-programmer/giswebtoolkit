#!/bin/bash

CURRENT_DIR_UNLINKED=$(readlink -f "$0")
CURRENT_DIR=$(dirname "$CURRENT_DIR_UNLINKED")

echo "Building release..."
export VUE_CLI_SERVICE_CONFIG_PATH="$CURRENT_DIR/gwsse-app/vue.config.build.js" && npx vue-cli-service build

echo "Success building release!"
