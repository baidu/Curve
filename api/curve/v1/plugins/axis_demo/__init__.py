# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for axis init

    :entity: y_axis()
    :invoked: init in data uploading
    :distinct: true

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import numpy as np


def y_axis(api, line):
    """

    :param api: plugin api object, select is not implement during init.
    :param line: tuple-like ((timestamp, value)), the timestamp and value is const
    :return: plugin_name, (y_axis_min, y_axis_max)
    """
    values = np.asarray([point[1] for point in line if point[1] is not None])
    value_min, value_max = np.min(values), np.max(values)
    y_axis_min_per, y_axis_max_per = np.percentile(values, 0.3), np.percentile(values, 99.7)
    y_axis_min = y_axis_min_per - (y_axis_max_per + y_axis_min_per) * 0.05
    y_axis_max = y_axis_max_per + (y_axis_max_per + y_axis_min_per) * 0.05
    if value_min > 0:
        y_axis_min = max(0, y_axis_min)
    if value_max < 1:
        y_axis_max = min(1, y_axis_max)
    elif value_max < 100:
        y_axis_max = min(100, y_axis_max)
    return 'default', (y_axis_min, y_axis_max)
