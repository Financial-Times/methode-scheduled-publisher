#!/bin/bash

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
MODULE_NAME=$(cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
FILE_NAME=${MODULE_NAME}-${PACKAGE_VERSION}.zip

rm -rf dest
mkdir dest
cp -R node_modules dest
cp -R src/* dest
cd dest
zip -r ../${FILE_NAME} *
rm -rf ../dest