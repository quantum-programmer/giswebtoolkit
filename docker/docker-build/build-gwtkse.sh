#!/bin/bash


echo -ne "Copying files..."
cp ./gwtk-source/*.* .
cp ./gwtk-source/.browserslistrc ./gwtk-source/.eslintignore ./gwtk-source/.eslintrc.js .
cp -R ./gwtk-source/public .
cp -R ./gwtk-source/src .
cp -R './gwtk-source/GIS WebToolKit SE' .
cp -R ./gwtk-source/webpack-configs .
cp -R ./gwtk-source/example .

echo "Done!"

echo "Jest tests start..."
npm run test||exit
echo "Success jest test!"

echo "Building release..."
npm run build||exit
echo "Success building release!"

echo -ne "Copying release files..."
if [[ ! -d ./gwtk-source/release ]]; then
  mkdir ./gwtk-source/release
fi

rm -rf ./gwtk-source/release/*
cp -R -a  ./release/. ./gwtk-source/release
cp ./gwtk-source/LIBRARY_FILENAME ./gwtk-source/release
echo "Done!"


