#!/bin/bash

# System:
#   1. Darwin or Linux
# Python:
#   1. version: 2.7.3+/3.1.2+ is recommended
#   2. other:
#       * python should belong to current user
#       * pip is required
# Node.js:
#   1. version: 4.7.0+ is recommended
#   2. other:
#       * npm is required

set -u
set -e

cd "$(dirname "$0")"
readonly G_ROOT_DIR=`pwd`
readonly G_WEB_DIR="${G_ROOT_DIR}/web"
readonly G_API_DIR="${G_ROOT_DIR}/api"

G_VERSION='none'
if [ -e .git ]; then
    G_VERSION=`git rev-parse HEAD`
fi
G_CONDA=''


PS1='$'

cutoff() {
    echo "============================================================="
}


help() {
    echo "${0} <start|stop|reload|terminate|version>"
    exit 1
}

version() {
    if [ ${G_VERSION}x != 'x' ]; then
        cutoff
        echo "local Curve version: ${G_VERSION}"
        cutoff
    fi
}

check_web() {
    readonly BUILD_PATH="${G_WEB_DIR}/build"
    readonly BUILD_VERSION_FILE="${BUILD_PATH}/version"
    BUILD_VERSION=''
    if [ -e ${BUILD_VERSION_FILE} ]; then
        BUILD_VERSION=`cat ${BUILD_VERSION_FILE}`
    fi
    readonly DEPLOY_PATH="${G_API_DIR}/curve/web"
    readonly DEPLOY_VERSION_FILE="${DEPLOY_PATH}/version"
    DEPLOY_VERSION=''
    if [ -e ${DEPLOY_VERSION_FILE} ]; then
        DEPLOY_VERSION=`cat ${DEPLOY_VERSION_FILE}`
    fi

    if [ ${G_VERSION}x != 'x' -a ${G_VERSION}x == ${DEPLOY_VERSION}x ]; then
        return
    fi

    cutoff
    echo "build web..."
    if [ ${G_VERSION}x == 'x' -o ${G_VERSION}x != ${BUILD_VERSION}x ]; then
        cd ${G_WEB_DIR}
        npm install
        npm run build
        echo ${G_VERSION} > ${BUILD_VERSION_FILE}
    fi
    if [ -e ${DEPLOY_PATH} ]; then
        rm -rf ${DEPLOY_PATH}
    fi
    mv ${BUILD_PATH} ${DEPLOY_PATH}
    echo "web built."
    cutoff
}

check_py() {
    readonly VENV_VERSION_FILE="${G_ROOT_DIR}/pylib_version"
    VENV_VERSION=''
    if [ -e ${VENV_VERSION_FILE} ]; then
        VENV_VERSION=`cat ${VENV_VERSION_FILE}`
    fi

    if [ ${G_VERSION}x != 'x' -a ${G_VERSION}x == ${VENV_VERSION}x ]; then
        return
    fi

    cutoff
    pip install -r ${G_API_DIR}/requirements.txt
    echo ${G_VERSION} > ${VENV_VERSION_FILE}
    cutoff
}

check_api() {
    readonly SWAGGER_UI_DIR="${G_API_DIR}/curve/web/swagger-ui"
    readonly SWAGGER_UI_VERSION_FILE="${SWAGGER_UI_DIR}/version"
    SWAGGER_UI_VERSION=''
    if [ -e ${SWAGGER_UI_VERSION_FILE} ]; then
        SWAGGER_UI_VERSION=`cat ${SWAGGER_UI_VERSION_FILE}`
    fi

    if [ ${G_VERSION}x != 'x' -a ${G_VERSION}x == ${SWAGGER_UI_VERSION}x ]; then
        return
    fi

    cutoff
    echo "deploy api..."
    cd ${G_ROOT_DIR}
    pip install swagger-py-codegen==0.2.9 dpath==1.5.0
    swagger_py_codegen --ui --spec -s doc/web_api.yaml api -p curve
    if [ -e ${G_API_DIR}/curve/web/swagger-ui ]; then
        rm -rf ${G_API_DIR}/curve/web/swagger-ui
    fi
    mv ${G_API_DIR}/curve/static/swagger-ui ${G_API_DIR}/curve/web/
    if [ -e ${G_API_DIR}/curve/web/static/v1 ]; then
        rm -rf ${G_API_DIR}/curve/web/static/v1
    fi
    mv ${G_API_DIR}/curve/static/v1 ${G_API_DIR}/curve/web/static/
    rm -rf ${G_API_DIR}/curve/static

    patch ${G_API_DIR}/curve/web/swagger-ui/index.html ${G_ROOT_DIR}/opt/swagger-ui/index.html.patch
    echo ${G_VERSION} > ${SWAGGER_UI_VERSION_FILE}
    echo "api deployed."
    cutoff
}

check_path() {
    mkdir -p ${G_API_DIR}/log
}

check() {
    check_web
    check_py
    check_api
    check_path
}

start() {
    if [ -e ${G_API_DIR}/uwsgi.pid ]; then
        PID=`cat ${G_API_DIR}/uwsgi.pid`
        if [ `ps -ef | fgrep uwsgi | fgrep ${PID} | wc -l` -gt 0 ]; then
            echo "Curve is running."
            return
        fi
    fi
    check
    if [ `ps -ef | fgrep uwsgi | fgrep -v 'grep' | wc -l` -gt 0 ]; then
        ps -ef | fgrep uwsgi | fgrep -v 'grep' | awk '{ print $2 }' | xargs kill -9
    fi
    echo "start Curve..."
    cd ${G_API_DIR}
    uwsgi uwsgi.ini
    echo "Curve started."
}

stop() {
    echo "stop Curve..."
    cd ${G_API_DIR}
    [ -e uwsgi.pid ] && uwsgi --stop uwsgi.pid
    echo "Curve stopped."
}

reload() {
    check
    if [ -e ${G_API_DIR}/uwsgi.pid ]; then
        PID=`cat ${G_API_DIR}/uwsgi.pid`
        if [ `ps -ef | fgrep uwsgi | fgrep ${PID} | wc -l` -gt 0 ]; then
            echo "reload Curve..."
            cd ${G_API_DIR}
            uwsgi --reload uwsgi.pid
            echo "Curve reloaded."
            return
        fi
    fi
    echo "clean Curve..."
    if [ `ps -ef | fgrep uwsgi | fgrep -v 'grep' | wc -l` -gt 0 ]; then
        ps -ef | fgrep uwsgi | fgrep -v 'grep' | awk '{ print $2 }' | xargs kill -9
    fi
    echo "start Curve..."
    cd ${G_API_DIR}
    uwsgi uwsgi.ini
    echo "Curve reloaded."
}

terminate() {
    echo "terminate Curve..."
    if [ `ps -ef | fgrep uwsgi | fgrep -v 'grep' | wc -l` -gt 0 ]; then
        ps -ef | fgrep uwsgi | fgrep -v 'grep' | awk '{ print $2 }' | xargs kill -9
        echo "Curve terminated."
    fi
    echo "Curve is not running."
}

case "${1}" in
check)
    version
    check
    ;;
start)
    version
    start
    ;;
stop)
    stop
    ;;
reload)
    version
    reload
    ;;
terminate)
    terminate
    ;;
help)
    help
    ;;
version)
    version
    ;;
*)
    help
    ;;
esac
