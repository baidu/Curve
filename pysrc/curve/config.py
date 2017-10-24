# -*- coding: utf-8 -*-
"""
    Curve
    ~~~~
    configure file

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import os


SQLITE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'curve.db')
STATIC_FOLDER = 'web'
STATIC_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'web')
INDEX_PAGE = '/' + STATIC_FOLDER + '/index.html'
DEFAULT_HOST = '0.0.0.0'
DEFAULT_PORT = 8080
