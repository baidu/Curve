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


# TODO: other init operation during init
def init_band(api):
    """
    :param api: api for plugins
    :return: (band_name, [(start_time, end_time)])
    """
    line = api.get_data()
    abnormal_bands = []
    for point_no, point in enumerate(sorted(line)[6:]):
        if point[1] > sum([
            x[1]
            for x in line[point_no:point_no + 5]
            if x[1] is not None
        ]) * 0.21:
            if not abnormal_bands or len(abnormal_bands[-1]) == 2:
                abnormal_bands.append([point[0]])
        elif abnormal_bands and len(abnormal_bands[-1]) == 1:
            abnormal_bands[-1].append(point[0])
    if abnormal_bands and len(abnormal_bands[-1]) == 1:
        abnormal_bands[-1].append(sorted(line)[-1][0])

    return '5min mean ratio gt 5%', abnormal_bands
