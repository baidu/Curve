#!/bin/bash

if [ ! -n "$1" ] then
    echo "Usages: bash control.sh [start|stop|reload|terminate]"
    exit 0
fi

if [ $1 = start ] then
    psid=`ps aux | grep "uwsgi" | grep -v "grep" | wc -l`
    if [ $psid -gt 4 ] then
        echo "uwsgi is running!"
        exit 0
    else
        uwsgi /etc/uwsgi.ini
        echo "Start uwsgi service [OK]"
    fi
elif [ $1 = stop ];then
    killall -9 uwsgi
    echo "Stop uwsgi service [OK]"
elif [ $1 = restart ];then
    killall -9 uwsgi
    /usr/bin/uwsgi --ini /etc/uwsgi.ini
    echo "Restart uwsgi service [OK]"

else
    echo "Usages: sh uwsgiserver.sh [start|stop|restart]"
fi


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
