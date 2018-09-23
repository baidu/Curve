# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for menu

    :entity: menus()
    :invoked: init web page
    :distinct: false

    :entity: ${menu_item}()
    :invoked: menu item is clicked
    :distinct: true

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""


def menus():
    """

    :return: [(action, menu_name)]
    """
    return [
        ('cancel_label', 'Cancel the label')
    ]


def cancel_label(api, start_time, end_time):
    """
    action in menus
    :param api: api for plugins
    :param start_time:
    :param end_time:
    :return:
    """
    api.set_label(start_time, end_time, api.LABEL_ENUM.normal)
    return ''
