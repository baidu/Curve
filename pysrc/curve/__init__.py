# -*- coding: utf-8 -*-
"""
    Curve
    ~~~~
    A label tool for Time-series data

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from .app import create_app

from .config import DEFAULT_HOST
from .config import DEFAULT_PORT

if __name__ == '__main__':
    # TODO:
    # 1. argv from console
    # 2. nginx+cgi/usgi
    #   http://www.pythondoc.com/flask/deploying/fastcgi.html#fcgi
    #
    # 3. setup.py
    create_app().run(host=DEFAULT_HOST, port=DEFAULT_PORT)
