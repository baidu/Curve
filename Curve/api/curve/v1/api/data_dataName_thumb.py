# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

from v1 import utils
from .resource import Resource
from v1.services import DataService


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
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        thumb = data_service.get_thumb()

        return self.render_json_str(thumb.view())
