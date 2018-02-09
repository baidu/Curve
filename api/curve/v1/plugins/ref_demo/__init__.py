# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for ref
    :entity: reference()
    :invoked: trend rendering
    :exclusive: false
    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""


def reference(api, line):
    """
    :param api: api for plugins
    :param line: [(timestamp, value...)]
    :return: [(timestamp, value)]
    """
    result = []

    if len(line) > 0:
        start_time = line[0][0]
        end_time = line[-1][0]
        result.append(api.get_data(start_time - api.DAY, end_time - api.DAY))

    return 'Day on Day', result
