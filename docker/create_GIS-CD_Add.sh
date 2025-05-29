#!/bin/bash


CURRENT_DIR_UNLINKED=$(readlink -f "$0")
DOCKER_DIR=$(dirname "$CURRENT_DIR_UNLINKED")
CURRENT_DIR=$(readlink -f "$DOCKER_DIR/../")

if [[ ! -z $BUILD_NUMBER ]]; then
  BUILDNUMB=$BUILD_NUMBER
else
  BUILDNUMB=9999
fi

VERSION_NUMBER="$(grep version "$CURRENT_DIR/package.json" | head -n 1 | cut -d ':' -f2 | grep -oE '[0-9\.]+').${BUILDNUMB}"

echo "Creating tar GIScdAdd archive"

if [[ ! -d "$CURRENT_DIR/archive-giscdadd" ]]; then
  mkdir "$CURRENT_DIR/archive-giscdadd"
fi

if [[ ! -d "$CURRENT_DIR/archive-giscdadd/GIS WebToolkit SE $VERSION_NUMBER" ]]; then
  mkdir "$CURRENT_DIR/archive-giscdadd/GIS WebToolkit SE $VERSION_NUMBER"
fi

GISCDADD_DIR=$(readlink -f "$CURRENT_DIR/archive-giscdadd/GIS WebToolkit SE $VERSION_NUMBER")

echo -ne "Copy source code..."
git archive --format=tar --prefix=tempcopy/ HEAD | tar xf -
cp -R ./tempcopy "$GISCDADD_DIR/GIS WebToolkit SE/"
rm -R ./tempcopy
echo 'Done!'

echo -ne "Copy documentation..."

cp -R "./Эксплуатационная документация" "$GISCDADD_DIR/"
rm -R "./Эксплуатационная документация"
echo 'Done!'

echo -ne "Copy readme..."
mv readme.txt "$GISCDADD_DIR/"
echo 'Done!'

echo -ne "Creating tar archive..."
cd "$CURRENT_DIR/archive-giscdadd" || exit

tar cvf "../GIS_WebToolKit_SE.tar" "GIS WebToolkit SE $VERSION_NUMBER"
echo 'Done!'

#read -p "Press any key to resume ..."

cd - || exit
echo "Creating tar completed"

