# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for band init

    :entity: init_band()
    :invoked: init in data uploading
    :distinct: true

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""

import numpy as np


def init_band(api, line):
    """

    :param api: plugin api object, select is not implement during init.
    :param line: tuple-like ((timestamp, value)), the timestamp and value is const
    :return: (band_name, [(reliability, start_time, end_time)]) reliability is optional
    """
    abnormal_bands = []
    tmp = np.array([x[1] for x in line if x[1] is not None])
    lower = np.percentile(tmp, 0.3)
    upper = np.percentile(tmp, 99.7)

    for point_no, point in enumerate(line):
        if point[1] > upper or point[1] < lower:
            if not abnormal_bands or len(abnormal_bands[-1]) == 2:
                abnormal_bands.append([point[0]])
        elif abnormal_bands and len(abnormal_bands[-1]) == 1:
            abnormal_bands[-1].append(point[0])
    if abnormal_bands and len(abnormal_bands[-1]) == 1:
        abnormal_bands[-1].append(sorted(line)[-1][0])

    return 'threshold of 3% quantile', abnormal_bands
