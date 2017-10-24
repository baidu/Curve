# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    Web API blue print build

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import

import flask_restful as restful
from flask import Blueprint

from .routes import routes
from .validators import security


@security.scopes_loader
def current_scopes():
    """
    init security setting
    :return: pending
    """
    return []

bp = Blueprint('v1', __name__)
api = restful.Api(bp, catch_all_404s=True)

for route in routes:
    api.add_resource(route.pop('resource'), *route.pop('urls'), **route)
