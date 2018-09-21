# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for ref

    :entity: reference()
    :invoked: after data uploaded
    :distinct: no

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""


def reference(api, line):
    """
    week on week 10% area
    :param api: plugin api object, select is not implement during init.
    :param line: tuple-like ((timestamp, value)), the timestamp and value is const
    :return: (reference_name, [[timestamp, value, range]]), tuple is not recommended
    """
    res = []

    if len(line) > 0:
        offset = api.WEEK / api.get_period()
        res = []
        for idx in range(len(line) - 1, -1, -1):
            if idx - offset > -1 and line[idx - offset][1] is not None:
                res.append([line[idx][0], line[idx - offset][1], line[idx - offset][1] * 0.1])
            else:
                res.append([line[idx][0], None, 0])

    return 'Week on Week 10%', res
