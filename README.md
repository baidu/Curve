Curve
---

Curve is an open-source tool to help label anomalies on time-series data. The labeled data (also known as the ground truth) is necessary for evaluating time-series anomaly detection methods. Otherwise, one can not easily choose a detection method, or say method A is better than method B. The labeled data can also be used as the training set if one wants to develop supervised learning methods for detection.

Curve is designed to support plugin, so one can equip Curve with customized and powerful functions to help label effectively. For example, a plugin to identify anomalies which are similar to the one you labeled, so you don't have to search them through all the data.

Curve is originally developed by Baidu and [Tsinghua Netman Lab](https://netman.cs.tsinghua.edu.cn/).


## Getting Started

### install dependency and build*

Make sure bash, python2.7+ with pip and nodejs with npm is on your unix-like system, then run build script.

```bash
# python2.7+ is required
# npm is required
bash -x build.sh
```

Power Shell will be supported in future.

### run

Server will blind 0.0.0.0:8080 by default, change port in configure file if necessary.

#### run as a python module

```modify port config in config.py```

```bash
# TODO: add support for module, which is confict with baidu codestyle
cp ${BIN_DIR}/curve/__init__.py ${BIN_DIR}/curve/__main__.py
# run command
# TODO: add command args support for config
cd ${BIN_DIR} && python -m curve
```

```maybe ```

#### run with uwsgi

```modify port config in uwsgi.ini```

```bash
pip install uWSGI
cd ${BIN_DIR} && uwsgi uwsgi.ini
```

## test

```bash
cd ${BIN_DIR} && pytest
```

## plugin dir

```curve/curve/v1/plugins```

