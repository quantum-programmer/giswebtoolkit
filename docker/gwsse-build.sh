#!/bin/bash

CURRENT_DIR_UNLINKED=$(readlink -f "$0")
CURRENT_DIR=$(dirname "$CURRENT_DIR_UNLINKED")

GWTK_APP_DIR_RELATIVE="$CURRENT_DIR/../"
GWTK_APP_DIR=$(readlink -f "$GWTK_APP_DIR_RELATIVE")

CONTAINER_NAME='gwsse-build'

cd "$CURRENT_DIR/docker-build" || exit

cp -R -a ./../../package.json .

echo 'Building container...'
docker build -t gwtk-build-slim . || exit

rm package.json

if [[ ! -z $BUILD_NUMBER ]]; then
  BUILDNUMB=$BUILD_NUMBER
else
  BUILDNUMB=9999
fi

echo "Writing version description files..."

GWTK_NAME="$(grep name "$GWTK_APP_DIR/package.json" | head -n 1 | cut -d ':' -f2 | grep -oE '\w+')"
GWTK_VERSION="$(grep version "$GWTK_APP_DIR/package.json" | head -n 1 | cut -d ':' -f2 | grep -oE '[0-9\.]+')"
echo -n $GWTK_VERSION >"$GWTK_APP_DIR/GIS WebToolKit SE/VERSIONNUMBER"
echo -n "${GWTK_VERSION}.${BUILDNUMB}" > "$GWTK_APP_DIR/VERSIONBUILDNUMBER"
echo -n "$GWTK_NAME-$GWTK_VERSION-$BUILDNUMB" >"$GWTK_APP_DIR/LIBRARY_FILENAME"

echo "Running $CONTAINER_NAME container..."
docker run --rm \
  --name $CONTAINER_NAME \
  -v "$GWTK_APP_DIR":/usr/src/app/gwtk-source \
  -e BUILDNUMB=$BUILDNUMB \
  gwtk-build-slim bash ./gwtk-source/docker/docker-build/build-gwsse.sh && exit 0

if (($? != 0)); then
  echo "====> Error compiling!"
  exit 1
fi

echo "Build completed!"
