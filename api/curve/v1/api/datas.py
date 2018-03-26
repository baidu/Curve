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

from v1.services import DataService
from .resource import Resource


class Datas(Resource):
    """
    ref: web_api.yaml
    """

    def get(self):
        """
        ref: web_api.yaml
        :return:
        """
        pattern = None
        if 'pattern' in g.args:
            pattern = g.args['pattern']
        datas = DataService.list(pattern)
        user = g.user.login
        datas = filter(lambda x: x.owner == user,
                       datas)  # + filter(lambda x: x.owner != user and x.public_read, datas)
        return self.render(data=[data.view() for data in datas])
