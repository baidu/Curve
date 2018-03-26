# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import flask

from .resource import Resource


class Logout(Resource):
    """
    ref: web_api.yaml
    """

    def get(self):
        """
        ref: web_api.yaml
        """
        flask.session.pop('uid', None)
        return self.redirect('/')
