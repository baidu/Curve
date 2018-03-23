# -*- coding: utf-8 -*-
"""
    Curve
    ~~~~
    profile for dev

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from werkzeug.contrib.profiler import ProfilerMiddleware

from curve import create_app
from curve.config import DEFAULT_HOST
from curve.config import DEFAULT_PORT

if __name__ == '__main__':
    app = create_app()
    app.config['PROFILE'] = True
    app.config['SQLALCHEMY_ECHO'] = True
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    app.wsgi_app = ProfilerMiddleware(app.wsgi_app, restrictions=[30])
    app.run(debug=True, host=DEFAULT_HOST, port=DEFAULT_PORT, threaded=True)
