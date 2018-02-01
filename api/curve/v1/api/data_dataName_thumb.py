# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

from .base_api import Resource
from ..service import DataService
from ..utils import s2ms


class DataDatanameThumb(Resource):
    """
    ref: web_api.yaml
    """

    def get(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = dataName
        if isinstance(data_name, unicode):
            data_name = data_name.encode('utf-8')
        data_service = DataService(data_name)
        thumb = data_service.get_thumb()
        thumb = s2ms(thumb)

        return self.render(data={
                'name': data_name,
                'type': 'line',
                'data': thumb
            }), 200, None
