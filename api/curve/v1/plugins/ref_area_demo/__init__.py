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
    :return: [(timestamp, y_lower, y_upper)]
    """
    result = []

    if len(line) > 0:
        start_time = line[0][0]
        end_time = line[-1][0]

        line = api.get_data(start_time - api.WEEK, end_time - api.WEEK)
        area = []
        for timestamp, value in line:
            if value is not None:
                area.append((timestamp + api.WEEK, value * 0.9, value * 1.1))
            else:
                area.append((timestamp + api.WEEK, None, None))
        result = area

    return 'Week on Week 10% diff', result
