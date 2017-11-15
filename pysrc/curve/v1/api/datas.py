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

        for data_no, data in enumerate(datas):
            datas[data_no] = {
                "id": data.id,
                "name": data.name,
                "uri": '/v1/data/%s' % data.name,
                "createTime": data.create_time * 1000,
                "updateTime": data.update_time * 1000,
                "labelRatio": data.label_ratio,
                "period": {
                    "length": data.period,
                    "ratio": data.period_ratio
                },
                "display": {
                    "start": data.start_time * 1000,
                    "end": min(data.start_time + 86400, data.end_time) * 1000
                },
                "time": {
                    "start": data.start_time * 1000,
                    "end": data.end_time * 1000
                }
            }

        return self.render(data=datas), 200, None
