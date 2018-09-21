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
from flask import current_app

from .resource import Resource
import config


class LoginRedirect(Resource):
    """
    ref: web_api.yaml
    """
    def get(self):
        """
        ref: web_api.yaml
        """
        if flask.g.user is None:
            for platform, key in current_app.config['OAUTH'].items():
                # TODO: other oauth platform support
                if platform == 'github':
                    return self.redirect(config.API_SERVER + '/v1/login/redirect/github', ajax=True)
            flask.g.user = 'guest'
        return self.redirect(config.STATIC_SERVER, ajax=True)
