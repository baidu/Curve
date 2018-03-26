# -*- coding: utf-8 -*-
"""
    Curve
    ~~~~
    A label tool for Time-series data

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""


def create_app():
    import sys
    import os
    abs_path = os.path.abspath(os.path.realpath(os.path.dirname(__file__)))
    if abs_path not in sys.path:
        sys.path.append(abs_path)
    from app import create_app
    return create_app()


if __name__ == '__main__':
    import config as conf
    # TODO:
    # 1. argv from console
    # 2. setup.py
    create_app().run(host=conf.DEFAULT_HOST, port=conf.DEFAULT_PORT)
