#!/bin/bash


export PORT=8081

CURRENT_DIR_UNLINKED=$(readlink -f "$0")
CURRENT_DIR=$(dirname "$CURRENT_DIR_UNLINKED")
GWTK_APP_DIR="$CURRENT_DIR/docker-node-server/gwtk-app"

export CURRENT_DIR
export GWTK_APP_DIR

cd "$CURRENT_DIR/docker-node-server" ||exit

echo -ne 'Copying production files...'
if [[ ! -d gwtk-app ]]; then
  mkdir gwtk-app
fi
rm -rf ./gwtk-app/*
cp -R -a ./../../gwtk-app/index.html ./../../gwtk-app/main.js ./../../release/. gwtk-app
echo 'DONE!'

echo -ne 'Replacing template string...'
TEMPLATE='MapVue-6.23.0-1'
REPLACE_VALUE=$(cat gwtk-app/LIBRARY_FILENAME)
sed -i "s/$TEMPLATE/$REPLACE_VALUE/g" gwtk-app/index.html
echo 'DONE!'

echo "Starting containers..."

docker-compose build
docker-compose up --force-recreate --abort-on-container-exit

if (($? != 0)); then
  echo "====> Tests ERROR!"
  exit 1
fi
