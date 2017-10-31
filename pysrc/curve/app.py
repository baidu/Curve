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

from .config import INDEX_PAGE
from .config import SQLITE_PATH
from .config import STATIC_PATH
from .v1 import bp
from .v1.models import db


def create_app():
    """
    init app
    :return: flask app
    """
    app = flask.Flask(__name__, static_folder=STATIC_PATH)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + SQLITE_PATH
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    db.init_app(app)
    with app.test_request_context():
        db.create_all()
    app.register_blueprint(bp, url_prefix='/v1')
    CORS(app)

    return app
