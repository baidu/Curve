#!/bin/bash
# for Darwin and Linux

# nodejs is required
# npm is required

set -u
set -e

readonly G_ROOT_DIR=`pwd`
readonly G_WEB_DIR="${G_ROOT_DIR}/web"
readonly G_API_DIR="${G_ROOT_DIR}/api"

readonly G_GIT_VERSION=`git rev-parse HEAD`

readonly BUILD_PATH="${G_WEB_DIR}/build"
readonly BUILD_VERSION_FILE="${BUILD_PATH}/version"
readonly DEPLOY_PATH="${G_API_DIR}/Curve/web"

echo "build web..."
cd ${G_WEB_DIR}
npm install
npm run build
echo ${G_GIT_VERSION} > ${BUILD_VERSION_FILE}
if [ -e ${DEPLOY_PATH} ]; then
    rm -rf ${DEPLOY_PATH}
fi
mv ${BUILD_PATH} ${DEPLOY_PATH}