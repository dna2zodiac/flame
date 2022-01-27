#!/bin/bash

set -e

SELF=$(cd `dirname $0`/..; pwd)

go version

mkdir -p $SELF/local/bin
cd $SELF/local
echo '[dgraph] downloading ...'
git clone git://github.com/dgraph-io/dgraph.git
# alternatively, https://gitee.com/mirrors/Dgraph.git
cd dgraph
echo '[dgraph] building ...'
GO111MODULES=on go build -tags 'oss' -o $SELF/local/bin/dgraph dgraph/main.go
echo '[dgraph] ready.'
echo '[dgraph] - How to use:'
echo '[dgraph] dgraph zero --telemetry "sentry=false;reports=false;"'
echo '[dgraph] dgraph alpha --telemetry "sentry=false;reports=false; --lambda "num=0;"'
echo

cd ..
echo '[modified_zoekt] downloading ...'
git clone git://github.com/dna2fork/zoekt.git
# alternatively, https://gitee.com/mtgoc/zoekt.git
cd zoekt
echo '[modified_zoekt] building ...'
GO111MODULES=on go build -o $SELF/local/bin/zoekt-index cmd/zoekt-index/main.go
GO111MODULES=on go build -o $SELF/local/bin/zoekt-webserver contrib/cmd/zoekt-webserver/main.go
echo '[modified_zoekt] ready.'
echo '[modified_zoekt] - How to use:'
echo '[modified_zoekt] '"$SELF/local/bin/zoekt-index <path/to/src/root/*>"
echo '[modified_zoekt] ZOEKT_GIT_BIN=/usr/bin/git ZOEKT_P4_BIN=/bin/echo '"$SELF/local/bin/zoekt-webserver" \
   "-template_dir $SELF/local/zoekt/contrib/template" \
   "-fs_base_dir <path/to/src/root>"

