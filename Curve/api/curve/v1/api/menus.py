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
from v1.services.plugin import Plugin


class Menus(Resource):
    """
    ref: web_api.yaml
    """

    def get(self):
        """
        ref: web_api.yaml
        :return:
        """
        actions = []
        for menu in Plugin.get_menus():
            actions.append({
                "action": menu[0],
                "name": menu[1]
            })
        return self.render(data=actions)
