# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for sampling

    :entity: sampling()
    :invoked: trend/ref/label rendering
    :distinct: true

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""

import numpy as np


def sampling(api, line, target_amount):
    """

    :param api: plugin api object, select is not implement during init.
    :param line: tuple-like ((timestamp, value)), the timestamp and value is const
    :param target_amount: amount of points after sampling
    :return: (plugin_name, [[timestamp, value]]), tuple is not recommended
    """
    # Assume timestamp, value, range is not nullable
    if len(line) > target_amount and len(line) > 2:
        period = api.get_abstract().period  # timestamp is marked as the start time of a period
        start_time = line[0][0]
        end_time = line[-1][0]
        amount = (end_time - start_time) / period  # point amount without sampling
        aggr_period = iceil(amount, target_amount) / target_amount * period
        start_time = ifloor(line[0][0], aggr_period)
        tmp = {timestamp: [] for timestamp in range(start_time, end_time + period, aggr_period)}
        for point in line:
            tmp[ifloor(point[0], aggr_period)].append(point)
        line = [
            [timestamp, mean(points, lambda x: x[1]), mean(points, lambda x: x[2])]
            for timestamp, points in sorted(tmp.items())
        ]
    return 'default', line


def num_filter(x):
    return isinstance(x, (int, float, long))


def mean(data, key=None):
    if key is not None:
        data = [key(point) for point in data]
    data = filter(num_filter, data)
    if len(data) < 1:
        return None
    return np.mean(data)


def ifloor(data, base=None):
    """
    floor of int
    :param data:
    :param base:
    :return:
    """
    if base is None or base == 0:
        return data
    return data - data % base


def iceil(data, base=None):
    """
    ceil of int
    :param data:
    :param base:
    :return:
    """
    if base is None or base == 0:
        return data
    return data + -data % base
