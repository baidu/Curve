#!/bin/bash
# for Darwin and Linux

# python2.7.3+ is required
# pip is required
# nodejs is required
# npm is required

set -u
set -e

readonly G_ROOT_DIR=`pwd`
readonly G_WEB_DIR="${G_ROOT_DIR}/web"
readonly G_API_DIR="${G_ROOT_DIR}/api"
readonly G_VENV_DIR="${G_ROOT_DIR}/venv"

G_GIT_VERSION=''
if [ -e .git ]; then
    G_GIT_VERSION=`git rev-parse HEAD`
fi

PS1='$'

cutoff() {
    echo "============================================================="
}


help() {
    echo "${0} <start|stop|reload|terminate|version>"
    exit 1
}

version() {
    if [ ${G_GIT_VERSION}x != 'x' ]; then
        cutoff
        echo "local Curve version: ${G_GIT_VERSION}"
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

    if [ ${G_GIT_VERSION}x != 'x' -a ${G_GIT_VERSION}x == ${DEPLOY_VERSION}x ]; then
        return
    fi

    cutoff
    echo "build web..."
    if [ ${G_GIT_VERSION}x == 'x' -o ${G_GIT_VERSION}x != ${BUILD_VERSION}x ]; then
        cd ${G_WEB_DIR}
        npm install
        npm run build
        echo ${G_GIT_VERSION} > ${BUILD_VERSION_FILE}
    fi
    if [ -e ${DEPLOY_PATH} ]; then
        rm -rf ${DEPLOY_PATH}
    fi
    mv ${BUILD_PATH} ${DEPLOY_PATH}
    echo "web built."
    cutoff
}

check_venv() {
    readonly VENV_VERSION_FILE="${G_VENV_DIR}/version"
    VENV_VERSION=''
    if [ -e ${VENV_VERSION_FILE} ]; then
        VENV_VERSION=`cat ${VENV_VERSION_FILE}`
    fi

    if [ ${G_GIT_VERSION}x != 'x' -a ${G_GIT_VERSION}x == ${VENV_VERSION}x ]; then
        return
    fi

    cutoff
    echo "deploy venv..."
    if [ ! -e "${G_ROOT_DIR}/venv" ]; then
        pip install --upgrade pip
        pip install virtualenv
        virtualenv --no-site-packages ${G_VENV_DIR}
    fi
    source ${G_VENV_DIR}/bin/activate
    pip install -r ${G_API_DIR}/requirements.txt
    echo ${G_GIT_VERSION} > ${VENV_VERSION_FILE}
    echo "venv deployed."
    cutoff
}

check_api() {
    readonly SWAGGER_UI_DIR="${G_API_DIR}/curve/web/swagger-ui"
    readonly SWAGGER_UI_VERSION_FILE="${SWAGGER_UI_DIR}/version"
    SWAGGER_UI_VERSION=''
    if [ -e ${SWAGGER_UI_VERSION_FILE} ]; then
        SWAGGER_UI_VERSION=`cat ${SWAGGER_UI_VERSION_FILE}`
    fi

    if [ ${G_GIT_VERSION}x != 'x' -a ${G_GIT_VERSION}x == ${SWAGGER_UI_VERSION}x ]; then
        return
    fi

    cutoff
    echo "deploy api..."
    source ${G_VENV_DIR}/bin/activate
    pip install swagger-py-codegen==0.2.9
    cd ${G_ROOT_DIR}
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
    echo ${G_GIT_VERSION} > ${SWAGGER_UI_VERSION_FILE}
    echo "api deployed."
    cutoff
}

check_uwsgi() {
    mkdir -p ${G_API_DIR}/log
    # cause of nonstandard version number
    # sometimes uwsgi can't install in specific Linux distributions
    if [ -e "${G_VENV_DIR}/bin/uwsgi" ]; then
        return
    fi

    cutoff
    echo "install uwsgi..."
    source ${G_VENV_DIR}/bin/activate
    cd ${G_ROOT_DIR}
    pip download uwsgi==2.0.15
    tar -zxf uwsgi-2.0.15.tar.gz
    patch uwsgi-2.0.15/uwsgiconfig.py ${G_ROOT_DIR}/opt/uwsgi-2.0.15/uwsgiconfig.py.patch
    tar -zcf uwsgi-2.0.15.tar.gz uwsgi-2.0.15
    rm -rf uwsgi-2.0.15
    pip install uwsgi-2.0.15.tar.gz
    echo "uwsgi installed."
    cutoff
}

start() {
    if [ -e ${G_API_DIR}/uwsgi.pid ]; then
        PID=`cat ${G_API_DIR}/uwsgi.pid`
        if [ `ps -ef | fgrep uwsgi | fgrep ${PID} | wc -l` -gt 0 ]; then
            echo "Curve is running."
            return
        fi
    fi
    check_web
    check_venv
    check_api
    check_uwsgi
    if [ `ps -ef | fgrep uwsgi | fgrep -v 'fgrep' | wc -l` -gt 0 ]; then
        ps -ef | fgrep uwsgi | fgrep -v 'fgrep' | awk '{ print $2 }' | xargs kill -9
    fi
    echo "start Curve..."
    source ${G_VENV_DIR}/bin/activate
    cd ${G_API_DIR}
    uwsgi uwsgi.ini
    echo "Curve started."
}

stop() {
    echo "stop Curve..."
    cd ${G_API_DIR}
    source ${G_VENV_DIR}/bin/activate
    [ -e uwsgi.pid ] && uwsgi --stop uwsgi.pid
    echo "Curve stopped."
}

reload() {
    check_web
    check_venv
    check_api
    check_uwsgi
    if [ -e ${G_API_DIR}/uwsgi.pid ]; then
        PID=`cat ${G_API_DIR}/uwsgi.pid`
        if [ `ps -ef | fgrep uwsgi | fgrep ${PID} | wc -l` -gt 0 ]; then
            echo "reload Curve..."
            source ${G_VENV_DIR}/bin/activate
            cd ${G_API_DIR}
            uwsgi --reload uwsgi.pid
            echo "Curve reloaded."
            return
        fi
    fi
    echo "clean Curve..."
    if [ `ps -ef | fgrep uwsgi | fgrep -v 'fgrep' | wc -l` -gt 0 ]; then
        ps -ef | fgrep uwsgi | fgrep -v 'fgrep' | awk '{ print $2 }' | xargs kill -9
    fi
    echo "start Curve..."
    source ${G_VENV_DIR}/bin/activate
    cd ${G_API_DIR}
    uwsgi uwsgi.ini
    echo "Curve reloaded."
}

terminate() {
    echo "terminate Curve..."
    if [ `ps -ef | fgrep uwsgi | fgrep -v 'fgrep' | wc -l` -gt 0 ]; then
        ps -ef | fgrep uwsgi | fgrep -v 'fgrep' | awk '{ print $2 }' | xargs kill -9
        echo "Curve terminated."
    fi
    echo "Curve is not running."
}

case "${1}" in
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
