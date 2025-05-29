#!/bin/bash


SCRIPT_PATH_UNLINKED=$(readlink -f "$0")
SCRIPT_PATH=$(dirname "$SCRIPT_PATH_UNLINKED")

if [ -z "$OUT_FOLDER" ]; then
  OUT_FOLDER=$(readlink -f "$SCRIPT_PATH/../Эксплуатационная документация")
fi
if [ ! -d "$OUT_FOLDER" ]; then
  mkdir "$OUT_FOLDER"
fi

echo "OUT_FOLDER value - $OUT_FOLDER"

DOCS_00167_01_PATH="ПАРБ.00167-01_GIS WebToolKit SE/ПАРБ.00167-01_КД"
#DOCS_00167_01_PATH_EN="ПАРБ.00167-01_GIS WebToolKit SE/ПАРБ.00167-01_КД_EN"

DOCS_FTP_LINK_TEMPLATE="ftp://jenkins_ftp:UeG27A9Gxd66PMu@192.168.0.98/PDF В ИНСТАЛЛЯЦИЮ/%DOC_PATH%/%DOC_NAME%"

# $1 - download url
# $2 - output file
download_http_file()
{
  if (wget "$1" --output-document="$2" &>/dev/null); then
    echo "Downloading $1 - Success"
    return 1
  else
    echo "Downloading $1 - Failed"
    rm -f "$2"
    return 0
  fi
}
0:/PDF В ИНСТАЛЛЯЦИЮ/ПАРБ.00167-01_GIS WebToolKit SE/ПАРБ.00167-01_КД/
download_ftp_document()
{
  DOWNLOAD_DOC_LINK=$(echo "$DOCS_FTP_LINK_TEMPLATE" | sed -e "s|%DOC_NAME%|$1|g" -e "s|%DOC_PATH%|$DOCS_00167_01_PATH|g")
  download_http_file "$DOWNLOAD_DOC_LINK" "$OUT_FOLDER/$1"
}

echo "Updating docs"
# Download docs
download_ftp_document "00167-01 20 01_Ведомость ЭД.pdf"
download_ftp_document "00167-01 33 01_Руководство программиста.pdf"
echo " "

#read -p "Press any key to resume ..."
