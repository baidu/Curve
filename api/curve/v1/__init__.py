# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    Web API blue print build

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import

import flask_github
import flask_restful as restful
from flask import (
    Blueprint,
    current_app,
    g,
    request,
    session,
    redirect
)

from v1.models import User
from .routes import routes
from .validators import security


@security.scopes_loader
def current_scopes():
    """
    init security setting
    :return: pending
    """
    return []


path_prefix = '/v1'
bp = Blueprint(path_prefix, __name__)
api = restful.Api(bp, catch_all_404s=True)

for route in routes:
    api.add_resource(route.pop('resource'), *route.pop('urls'), **route)


@bp.before_request
def auth_filter():
    """
    make sure user is login
    :return:
    """
    g.user = None
    uid = session.get('uid', None)
    if uid is not None:
        g.user = User.query.filter_by(uid=uid).first()
    if g.user is None:
        login_path = path_prefix + '/login/redirect'
        if request.path.encode('utf-8').startswith(path_prefix + '/login'):
            return None
        for _ in current_app.config['OAUTH']:
            return redirect(login_path)
        g.user = User(uid='guest', name='guest')


def init_oauth(app):
    """
    init github oauth obj
    :param app: current app
    :return:
    """
    for server, conf in app.config['OAUTH'].items():
        if server == 'github':
            # For GitHub OAUTH
            app.config['GITHUB_OAUTH'] = True
            app.config['GITHUB_CLIENT_ID'] = app.config['OAUTH']['github']['id']
            app.config['GITHUB_CLIENT_SECRET'] = app.config['OAUTH']['github']['secret']

            app.github = flask_github.GitHub(app)

            @app.github.access_token_getter
            def token_getter():
                user = g.user
                if user is not None:
                    return user.github_access_token
