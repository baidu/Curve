#! /bin/sh

readonly G_HOME=`pwd`
readonly G_VENV="${G_HOME}/venv/bin/activate"
readonly G_CONTROL_NAME="${G_HOME}/control.sh"
readonly G_SOURCEROOT="${G_HOME}/pysrc"
readonly G_WEBROOT="${G_HOME}/pysrc/curve/web"

# TODO: check if built before

help() {
    echo "${0} <start|stop|reload|terminate>"
    exit 1
}

check() {
    cd ${G_SOURCEROOT}
    if [ -e uwsgi.pid ]; then
        ps -ef | fgrep uwsgi | fgrep `cat uwsgi.pid` > /dev/null
        return $?
    fi
    return 1
}

start() {
    check
    if [[ $? -ne 0 ]]; then
        terminate
        [ -e "${G_SOURCEROOT}/curve/web" ] || ./build.sh
        echo "start curve"
        cd ${G_SOURCEROOT}
        mkdir -p ${G_SOURCEROOT}/log
        source ${G_VENV}
        uwsgi uwsgi.ini
    else
        echo "curve is running"
    fi
}

stop() {
    cd ${G_SOURCEROOT}
    source ${G_VENV}
    [ -e uwsgi.pid ] && uwsgi --stop uwsgi.pid
}

reload() {
    cd ${G_SOURCEROOT}
    source ${G_VENV}
    check
    if [[ $? -ne 0 ]]; then
        echo "terminate curve"
        terminate
        echo "start curve"
        uwsgi uwsgi.ini
    else
        echo "reload curve"
        uwsgi --reload uwsgi.pid
    fi
}

terminate() {
    ps -ef | fgrep uwsgi | fgrep -v 'fgrep' | awk '{ print $2 }' | xargs kill -9
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
