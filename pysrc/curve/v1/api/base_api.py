# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    base class for web api

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import

import flask_restful as restful
from flask import make_response
from flask import request

from ..validators import request_validate
from ..validators import response_filter


class Resource(restful.Resource):
    """
    extend for restful.Resource, add for file and response render
    """
    method_decorators = [request_validate, response_filter]

    @staticmethod
    def render(msg='OK', data=None):
        """
        render json response
        :param msg: message for user
        :param data: response of data
        :return: response in dict type
        """
        host = request.host
        if ':' in host:
            host = host.split(':')[0]
        resp = {
            'msg': msg,
            'traceId': '',
            'server': host
        }
        if data is not None:
            resp['data'] = data

        return resp

    @staticmethod
    def render_file(filename, content):
        """
        render file response
        :param filename:
        :param content:
        :return: response in response type
        """
        content = content
        response = make_response(content)
        response.headers['Content-Disposition'] = 'attachment; filename=%s' % filename
        response.headers['Content-Type'] = 'text/plain'

        return response
