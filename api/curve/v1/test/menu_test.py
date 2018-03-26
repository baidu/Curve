# -*- coding: utf-8 -*-
"""
    Testing
    ~~~~
    menu list test

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""

from .base import IcurveTestCase


class MenuTestCase(IcurveTestCase):
    """
    menu list test
    """

    def test_menus(self):
        """
        menu list test
        """
        # prepare
        message = 'GET /v1/menus normal'
        # test
        response = self.client.get(path='/v1/menus')
        self.assertJsonResponse(response, 200, message)
