# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for sampling

    :entity: sampling()
    :invoked: trend/ref/label rendering
    :exclusive: true

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import math


def sampling(api, line, amount):
    """
    :param api: api for plugins
    :param line: [(timestamp, value...)]
    :param amount: amount of points after sampling
    :return: [(timestamp, value...)]
    """
    if amount < 1 or len(line) < amount:
        return 'sample demo', line
    period = api.get_meta().period
    start_time = line[0][0]
    end_time = line[-1][0] + period
    sample_period = __floor((end_time - start_time + .0) / amount, period)
    tmp_value = {
        timestamp: []
        for timestamp in range(
            start_time / sample_period * sample_period,
            end_time,
            sample_period
        )
    }
    for point in line:
        tmp_value[point[0] / sample_period * sample_period].append(point[1:])
    result = []
    is_line = True
    if len(line[0]) > 2:
        is_line = False
    for timestamp in sorted(tmp_value.keys()):
        # lower
        value = [x[0] for x in tmp_value[timestamp] if x[0] is not None]
        if len(value) > 0:
            value = float(sum(value)/len(value))
        else:
            value = None
        if is_line:
            result.append([timestamp, value])
            continue
        # upper
        upper = [x[1] for x in tmp_value[timestamp] if len(x) > 1 and x[1] is not None]
        if len(upper) > 0:
            upper = float(sum(upper)/len(upper))
        else:
            upper = None
        result.append([timestamp, value, upper])

    return 'sample demo', result


def __floor(data, base=None):
    if base is None or base == 0:
        return int(math.floor(data))
    return int(math.floor(data / base) * base)
