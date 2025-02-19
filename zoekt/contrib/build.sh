#!/bin/bash

SELF=$(cd `dirname $0`; pwd)

cd $SELF/..
if [ ! -d local/src/github.com/sourcegraph ]; then
   mkdir -p local/src/github.com/sourcegraph
   pushd local/src/github.com/sourcegraph
   ln -s ../../../.. zoekt
   popd
fi
cd local
GOPATH=`pwd` go install github.com/sourcegraph/zoekt/cmd/zoekt-index
GOPATH=`pwd` go install github.com/sourcegraph/zoekt/cmd/zoekt-webserver
