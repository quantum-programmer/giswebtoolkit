#!/bin/bash

echo "Creating tar archive from release"

cd ./release || exit

tar cvf ../gwtkse.tar .
cd - || exit
echo "Creating tar completed"
