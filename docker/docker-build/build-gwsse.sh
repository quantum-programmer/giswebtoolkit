#!/bin/bash


echo -ne "Copying files..."
cp ./gwtk-source/*.* .
cp ./gwtk-source/.browserslistrc ./gwtk-source/.eslintignore ./gwtk-source/.eslintrc.js .
cp -R ./gwtk-source/public .
cp -R ./gwtk-source/src .
cp -R './gwtk-source/GIS WebToolKit SE' .
cp -R ./gwtk-source/webpack-configs .
cp -R ./gwtk-source/gwsse-app .

echo "Done!"

echo "Jest tests start..."
npm run test||exit
echo "Success jest test!"

echo "Building release..."
export VUE_CLI_SERVICE_CONFIG_PATH=gwsse-app/vue.config.build.js && npx vue-cli-service build||exit
echo "Success building release!"

# replace ver number (preserve style.css browser cache)
TEMPLATE="styles.css?ver=1"
VERSION_BUILD_NUMBER=$(cat ./gwtk-source/VERSIONBUILDNUMBER)
REPLACE_VALUE="styles.css?ver=${VERSION_BUILD_NUMBER}"
sed -i "s/$TEMPLATE/$REPLACE_VALUE/g" ./release/index.html

echo "Building GWTKSE core..."
npm run build-gwtk
echo "Success building GWTKSE core!"

echo -ne "Copying release files..."
if [[ ! -d ./gwtk-source/release ]]; then
  mkdir ./gwtk-source/release
fi

rm -rf ./gwtk-source/release/*
cp -R -a  ./release/. ./gwtk-source/release
cp ./gwtk-source/LIBRARY_FILENAME ./gwtk-source/release
echo "Done!"


