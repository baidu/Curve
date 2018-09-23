# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

from flask import g

from .resource import Resource
from v1 import utils
from v1.services import DataService


class DataDatanameLabel(Resource):
    """
    ref: web_api.yaml
    """

    def put(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        if not data_service.exists():
            return self.render(msg='%s not found' % data_name, status=404)
        if not data_service.auth_edit():
            return self.render(msg='%s: data access forbidden' % data_name, status=403)
        start_time = g.args['startTime'] / 1000
        end_time = g.args['endTime'] / 1000
        label = g.args['label']

        data_service.set_label(start_time, end_time, label)

        return self.render()
