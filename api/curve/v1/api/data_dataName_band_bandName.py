# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

from .resource import Resource


class DataDatanameBandBandname(Resource):
    """
    ref: web_api.yaml
    """

    def get(self, dataName, bandName):
        """
        ref: web_api.yaml
        :param dataName:
        :param bandName:
        :return:
        """
        return self.render('Not Implemented', status=501)

    def delete(self, dataName, bandName):
        """
        ref: web_api.yaml
        :param dataName:
        :param bandName:
        :return:
        """
        return self.render('Not Implemented', status=501)
