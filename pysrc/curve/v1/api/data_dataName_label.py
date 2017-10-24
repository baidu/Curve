# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

from flask import g

from .base_api import Resource
from ..service import DataService


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
        data_name = dataName
        if isinstance(data_name, unicode):
            data_name = data_name.encode('utf-8')
        data_service = DataService(data_name)
        start_time = g.args['startTime'] / 1000
        end_time = g.args['endTime'] / 1000
        label = g.args['label']

        data_service.set_label(start_time, end_time, label)

        return self.render(), 200, None
