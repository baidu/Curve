Curve
---

Curve is an open-source tool to help label anomalies on time-series data. The labeled data (also known as the ground truth) is necessary for evaluating time-series anomaly detection methods. Otherwise, one can not easily choose a detection method, or say method A is better than method B. The labeled data can also be used as the training set if one wants to develop supervised learning methods for detection.

Curve is designed to support plugin, so one can equip Curve with customized and powerful functions to help label effectively. For example, a plugin to identify anomalies which are similar to the one you labeled, so you don't have to search them through all the data.

Curve is originally developed by Baidu and Tsinghua NetMan Lab. [click for preview](http://curve.baidu.com/web/index.html) 

<img src="https://raw.githubusercontent.com/baidu/Curve/master/doc/pic/index.png">

## Getting Started

### Run and stop

Simply use control.sh to start or stop Curve.

```bash
./control.sh start
./control.sh stop
```
Server will blind 8080 by default, you can change it in `./api/uwsgi.ini`.

> The first start will take a while because of the compilation. 
> If you pull updates from github, Rebuild will be triggered during start or reload.

### Data format

You can load a CSV file into Curve. The CSV should have the following format

* First column is the timestamp
* Second column is the value
* Third column (optional) is the label. 0 for normal and 1 for abnormal.

The header of CSV is optional, like `timestamp,value,label`.  

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

* Without the header and the label column

|1476460800|2566.35|
|---|---|
|1476460860|2704.65|
|1476460920|2700.05|

* Timestamp in human-readable format

|20161015000000|2566.35|
|---|---|
|20161015000100|2704.65|
|20161015000200|2700.05|

## Additional

### Recommend environments

#### For PC

Darwin(Mac OSX) or Linux(Ubuntu, CentOS, Arch, etc.) is Recommended

* Dependency:
    * Python 2.7.3+~~/3.1.2+~~(Python 3 does not seem to be supported as of now.), if python is not owned by current user, virtualenv is required
    * Node.js 4.7.0+
    * gcc, pip and npm path is correctly set

> Control Scripts for Windows is under development

#### For VPS like EC2

**Minimal**

* Server: 1 CPU, 512MB RAM, 5GB Storage
* System: Ubuntu10.04LTS or CentOS5.5

> Swap is required during build

**Recommend**

* Server: 1 CPU, 1GB RAM, 10GB Storage
* System: Ubuntu16.04LTS or CentOS7

### Backend Unit Test

```bash
cd api && pytest
```

### Plugin dir

```api/curve/v1/plugins```

### GitHub oauth

GitHub Oauth is supported, please put a configuration file into ```api/curve/auth/github_oauth.json``` like this:

```json
{
  "id": "your github application Client ID",
  "secret": "your application Client Secret"
}
```

> [Doc:Creating-An-Github-Oauth-App](https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/)

### Change Log
* 2018-08-07  [Function Optimization]: Refactoring code
