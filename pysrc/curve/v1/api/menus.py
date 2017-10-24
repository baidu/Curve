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
from ..service import PluginManager


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
        for menu in PluginManager.get_menus():
            actions.append({
                "action": menu[0],
                "name": menu[1]
            })
        return self.render(data=actions), 200, None
