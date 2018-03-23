# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

from flask import current_app
import flask_github

from .resource import Resource


class LoginRedirectGithub(Resource):
    """
    ref: web_api.yaml
    """

    def get(self):
        """
        ref: web_api.yaml
        """
        resp = flask_github.GitHub(current_app).authorize()
        return self.redirect(resp.headers['Location'])
