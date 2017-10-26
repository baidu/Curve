#! /bin/sh

readonly G_HOME=`pwd`
readonly G_VENV="${G_HOME}/venv/bin/activate"
readonly G_CONTROL_NAME="${G_HOME}/control.sh"
readonly G_SOURCEROOT="${G_HOME}/pysrc"

# TODO: check if built before

source ${G_VENV}

help() {
    echo "${0} <start|stop|reload|terminate>"
    exit 1
}

# TODO: check before operation

start() {
    cd ${G_SOURCEROOT}
    source ${G_VENV}
    uwsgi uwsgi.ini
}

stop() {
    cd ${G_SOURCEROOT}
    source ${G_VENV}
    uwsgi --stop uwsgi.pid
}

reload() {
    cd ${G_SOURCEROOT}
    source ${G_VENV}
    uwsgi --reload uwsgi.pid
}

terminate() {
    kill -9 uwsgi
}

case "${1}" in
start)
    start
    ;;
stop)
    stop
    ;;
reload)
    reload
    ;;
terminate)
    terminate
    ;;
*)
    help
    ;;
esac
