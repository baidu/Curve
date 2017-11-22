# -*- coding: utf-8 -*-
"""
    Curve
    ~~~~
    A label tool for Time-series data

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import

import flask
from flask_cors import CORS
from werkzeug.routing import BaseConverter

from .config import INDEX_PAGE
from .config import SQLITE_PATH
from .config import STATIC_PATH
from .v1 import bp
from .v1.models import db

import json
json.encoder.FLOAT_REPR = lambda x: format(x, '.2f')


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


def create_app():
    """
    init app
    :return: flask app
    """
    app = flask.Flask(__name__, static_folder=STATIC_PATH, static_url_path='')
    app.url_map.converters['regex'] = RegexConverter
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + SQLITE_PATH
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    db.init_app(app)
    with app.test_request_context():
        db.create_all()
    app.register_blueprint(bp, url_prefix='/v1')
    CORS(app)

    @app.route('/swagger-ui')
    def swagger_index(url=None):
        """
        redirect to index
        :return:
        """
        return flask.redirect('swagger-ui/index.html')

    @app.route('/swagger-ui/')
    def swagger_index2(url=None):
        """
        redirect to index
        :return:
        """
        return flask.redirect('swagger-ui')

    @app.route('/')
    def index(url=None):
        """
        redirect to index
        :return:
        """
        flask.head
        return app.send_static_file('index.html')

    return app
