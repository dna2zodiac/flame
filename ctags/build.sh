#!/bin/bash

SELF=$(cd `dirname $0`; pwd)

cd $SELF

# sudo apt install autoconf automake libtool gpref cmake pkg-config
BUILDACC=-j8
git clone https://github.com/dna2fork/ctags.git
cd ctags
mkdir -p local/dist

cd local

git clone https://github.com/akheron/jansson
cd jansson
mkdir build dist
cd build
cmake -DJANSSON_BUILD_DOCS=OFF -DCMAKE_INSTALL_PREFIX=`pwd`/../dist ..
make ${BUILDACC}
make install
cd ../..

git clone https://github.com/seccomp/libseccomp
cd libseccomp
mkdir dist
bash autogen.sh
./configure --prefix=`pwd`/dist --disable-shared
make ${BUILDACC}
make install
cd ..

git clone https://github.com/PCRE2Project/pcre2
cd pcre2
mkdir dist
bash autogen.sh
./configure --prefix=`pwd`/dist --disable-shared
make ${BUILDACC}
make install
cd ..

cd ..

export PKG_CONFIG_PATH=`pwd`/local/jansson/dist/lib/pkgconfig:`pwd`/local/libseccomp/dist/lib/pkgconfig:`pwd`/local/pcre2/dist/lib/pkgconfig
./configure --prefix=`pwd`/local/dist --enable-json --enable-seccomp --enable-static
make ${BUILDACC}
make install
