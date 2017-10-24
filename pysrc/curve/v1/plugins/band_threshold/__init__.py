# -*- coding: utf-8 -*-
"""
    plugin
    ~~~~
    plugin demo for band init

    :entity: init_band()
    :invoked: init in data uploading
    :exclusive: true

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""


def init_band(api):
    """
    :param api: api for plugins
    :return: (band_name, [(start_time, end_time)])
    """
    line = api.get_data()
    abnormal_bands = []
    tmp = sorted([x[1] for x in line])
    lower = tmp[len(tmp) / 20]
    upper = tmp[19 * len(tmp) / 20]

    for point_no, point in enumerate(line):
        if point[1] > upper or point[1] < lower:
            if not abnormal_bands or len(abnormal_bands[-1]) == 2:
                abnormal_bands.append([point[0]])
        elif abnormal_bands and len(abnormal_bands[-1]) == 1:
            abnormal_bands[-1].append(point[0])
    if abnormal_bands and len(abnormal_bands[-1]) == 1:
        abnormal_bands[-1].append(sorted(line)[-1][0])

    return 'threshold of 5% quantile', abnormal_bands
