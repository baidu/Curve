# -*- coding: utf-8 -*-
"""
    Curve
    ~~~~
    A label tool for Time-series data

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import

import json
import os
import random
import string

import flask
import flask_compress
import flask_cors
import werkzeug.routing

from db import db
import config
import log
import v1 as api


json.encoder.FLOAT_REPR = lambda x: format(x, '.4f')


def create_app():
    """
    init app
    :return: flask app
    """
    app = flask.Flask(__name__, static_folder=config.STATIC_PATH)

    log.init_log(app, config.LOG_PATH, config.LOG_LEVEL)

    flask_cors.CORS(app)
    flask_compress.Compress(app)

    class RegexConverter(werkzeug.routing.BaseConverter):
        """
        regular expression converts for route
        """
        def __init__(self, url_map, *items):
            """
            support for regular expression route
            :param url_map: alias for conflict with builtin 'map'
            :param items: regular expression
            """
            super(RegexConverter, self).__init__(url_map)
            self.regex = items[0]
    app.url_map.converters['regex'] = RegexConverter

    app.config['SECRET_KEY'] = ''.join(random.sample(string.ascii_letters + string.digits, 8))

    app.config['SQLALCHEMY_DATABASE_URI'] = config.DB_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.test_request_context():
        db.create_all()

    app.config['OAUTH'] = {}
    if os.path.isdir(config.OAUTH_DIR):
        for root, _, files in os.walk(config.OAUTH_DIR):
            for auth_file in filter(lambda x: x.endswith('_oauth.json'), files):
                try:
                    with open(os.path.join(root, auth_file)) as fp:
                        prefix = auth_file[:auth_file.find('_')]
                        oauth_config = json.load(fp)
                        if oauth_config is not None:
                            app.config['OAUTH'][prefix] = oauth_config
                except Exception as e:
                    app.logger.error(e.message)
    api.init_oauth(app)
    app.register_blueprint(api.bp, url_prefix='/v1')

    @app.route('/<regex("$"):url>')
    def web_index(url=None):
        """
        redirect to index
        :return:
        """
        return flask.redirect('/web/index.html')

    @app.route('/web/swagger-ui<regex("$"):url>')
    def swagger_index(url=None):
        """
        redirect to index
        :return:
        """
        return flask.redirect('/web/swagger-ui/index.html')

    return app
