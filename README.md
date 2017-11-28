Curve
---

Curve is an open-source tool to help label anomalies on time-series data. The labeled data (also known as the ground truth) is necessary for evaluating time-series anomaly detection methods. Otherwise, one can not easily choose a detection method, or say method A is better than method B. The labeled data can also be used as the training set if one wants to develop supervised learning methods for detection.

Curve is designed to support plugin, so one can equip Curve with customized and powerful functions to help label effectively. For example, a plugin to identify anomalies which are similar to the one you labeled, so you don't have to search them through all the data.

Curve is originally developed by Baidu and Tsinghua NetMan Lab.


<img src="https://raw.githubusercontent.com/baidu/Curve/master/readme/screenshot.png">

## Getting Started

### Install dependencies and build*

Make sure `bash`, `python2.7+ with pip` and `nodejs with npm` are already installed. Then run the build script. It will install all the dependenceis and build Curve. 

```bash
./build.sh
```

### Run and stop
Simply use control.sh to start or stop Curve.

```bash
./control.sh start
./control.sh stop
```
Server will blind 8080 by default, you can change it in `./pysrc/uwsgi.ini`.

*If you pull updates from github, make sure to rebuild first*


### Data format

You can load a CSV file into Curve. The CSV should have the following format

* First column is the timestamp
* Second column is the value
* Third column (optional) is the label. 0 for normal and 1 for abnormal.

The header of CSV is optinal, like `timestamp,value,label`.  

Some examples of valid CSV

* With a header and the label column

|timestamp|value|label|
|---|---|---|
|1476460800|2566.35|0|
|1476460860|2704.65|0|
|1476460920|2700.05|0|


* Without the header
 
|1476460800|2566.35|0|
|---|---|---|
|1476460860|2704.65|0|
|1476460920|2700.05|0|

* Without the header and the label colum

|1476460800|2566.35|
|---|---|
|1476460860|2704.65|
|1476460920|2700.05|

* Timestamp in human-readable format

|20161015000000|2566.35|
|---|---|
|20161015000100|2704.65|
|20161015000200|2700.05|


## Test

```bash
cd ${BIN_DIR} && pytest
```

## Plugin dir

```pysrc/curve/v1/plugins```

