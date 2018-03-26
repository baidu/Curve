# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    base class for web api

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import

import flask_restful as restful
from flask import make_response
from flask import request

from v1 import utils
from v1.validators import request_validate
from v1.validators import response_filter


class Resource(restful.Resource):
    """
    extend for restful.Resource, add for file and response render
    """
    method_decorators = [request_validate, response_filter]

    encode_if_unicode = utils.encode_if_unicode

    @staticmethod
    def redirect(location='/', ajax=False):
        if ajax:
            return Resource.render(msg='redirect', data=location)
        else:
            return Resource.render(status=302, header={'Location': location})

    @staticmethod
    def render(msg='OK', data=None, status=200, header=None):
        """
        render json response
        :param msg: message for user
        :param data: response of data
        :param status: http response status
        :param header: http response header
        :return: response in dict type
        """
        if header is None:
            header = {}
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

        return resp, status, header

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

    @staticmethod
    def render_json_str(content):
        """
        render plain response
        :param content:
        :return: response in response type
        """
        content = content
        response = make_response(content)
        response.headers['Content-Type'] = 'application/json'

        return response
