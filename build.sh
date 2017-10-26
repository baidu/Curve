#!/bin/bash
# build script for Darwin

# python2.7.3+ is required
# pip is required
# nodejs is required
# npm is required

ROOT_DIR=`pwd`
WEB_DIR="${ROOT_DIR}/web"
BIN_DIR="${ROOT_DIR}/pysrc"

# web build
cd ${WEB_DIR}
npm install
npm run build
[ -e ${BIN_DIR}/curve/web ] && rm -rf ${BIN_DIR}/curve/web
mv build ${BIN_DIR}/curve/web

# py build
cd ${ROOT_DIR}
pip install --upgrade pip
pip install virtualenv
virtualenv --no-site-packages ${ROOT_DIR}/venv
source ${ROOT_DIR}/venv/bin/activate
pip install swagger-py-codegen
swagger_py_codegen --ui --spec -s doc/web_api.yaml pysrc -p curve
[ -e ${BIN_DIR}/curve/web/swagger-ui ] && rm -rf ${BIN_DIR}/curve/web/swagger-ui
mv ${BIN_DIR}/curve/static/swagger-ui ${BIN_DIR}/curve/web/
[ -e ${BIN_DIR}/curve/web/v1 ] && rm -rf ${BIN_DIR}/curve/web/v1
mv ${BIN_DIR}/curve/static/v1 ${BIN_DIR}/curve/web/
sed -i -e "s%/static/v1/swagger.json%/web/v1/swagger.json%g" ${BIN_DIR}/curve/web/swagger-ui/index.html
rm -rf ${BIN_DIR}/curve/static
pip install -r ${BIN_DIR}/requirements.txt
pip install uwsgi

# package
if [ $? -ne 0 ]; then
    echo "========================================"
    echo "build uwsgi error, direct usage:"
    echo "cd ${BIN_DIR} && python -m curve"
else
    echo "========================================"
    echo "build done, usage:"
    echo "./control.sh start"
fi
