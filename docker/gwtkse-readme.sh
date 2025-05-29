#!/bin/bash


CURRENT_DIR_UNLINKED=$(readlink -f "$0")
CURRENT_DIR=$(dirname "$CURRENT_DIR_UNLINKED")

GWTK_APP_DIR=$(readlink -f "$CURRENT_DIR/../")

GWTK_VERSION="$(grep version "$GWTK_APP_DIR/package.json" | head -n 1 | cut -d ':' -f2 | grep -oE '[0-9\.]+')"

CONTAINER_NAME='gwtk-readme'

cd "$CURRENT_DIR/docker-create-readme" ||exit

echo 'Building container...'
docker build -t gwtk-readme-slim . ||exit

echo "Running $CONTAINER_NAME container..."
docker run --rm \
--name $CONTAINER_NAME \
-v "$GWTK_APP_DIR":/usr/src/app/result:rw \
-e GWTK_VERSION=$GWTK_VERSION \
gwtk-readme-slim

if (($? != 0)); then
  echo "====> Error compiling!"
  exit 1
fi

echo "Build completed!"
