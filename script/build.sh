#!/bin/bash

set -e

SELF=$(cd `dirname $0`/..; pwd)

rm -rf $SELF/dist
cd $SELF
./node_modules/.bin/webpack
cp src/client/index.html dist/static/
cp src/client/favicon.ico dist/static/
mkdir -p dist/static/img/
cp src/client/img/* dist/static/img/
