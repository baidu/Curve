# -*- coding: utf-8 -*-
"""
    Util
    ~~~~
    common function and definition

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import math
import time


def enum(**enums):
    """
    simple enum demo
    TODO
    :param enums: dict args of enums
    :return: An Enum
    """
    return type('Enum', (), enums)


LABEL_ENUM = enum(normal=0, abnormal=1, unknown=-1)
REPR_FILTER = {'_sa_instance_state'}
DEFAULT_TIMEFORMAT = '%Y%m%d%H%M%S'


def time2str(time_unix):
    """
    format unix timestamp to print
    :param time_unix: unix timestamp
    :return: printable
    """
    return time.strftime(DEFAULT_TIMEFORMAT, time.localtime(time_unix))


def str2time(time_str):
    """
    parse time to unix timestamp
    :param time_str: printable
    :return: unix timestamp
    """
    if len(time_str) == 14:  # YYYYMMDDhhmmss 20030405167800
        return int(time.mktime(time.strptime(time_str, DEFAULT_TIMEFORMAT)))
    return int(time_str)


def parse_label(label_raw):
    """
    parse label
    :param label_raw: label str
    :return: LABEL_ENUM
    """
    label = int(label_raw)
    if label not in {LABEL_ENUM.normal, LABEL_ENUM.abnormal}:
        raise Exception('label %s not valid.' % label_raw)
    return label


def repr_p(obj):
    """
    object printable translate
    :param obj:
    :return:
    """
    return '<%s %s>' % (
        obj.__class__.__name__,
        ' '.join([
            '%s:%s' % item
            for item in obj.__dict__.items()
            if item[0] not in REPR_FILTER
        ])
    )


def s2ms(data):
    """
    timestamp format s to ms
    :param data:
    :return:
    """
    res = []
    for point in data:
        point = list(point)
        point[0] *= 1000
        res.append(point)
    return res


def floor(data, base=None):
    """
    floor
    :param data:
    :param base:
    :return:
    """
    if base is None or base == 0:
        return int(math.floor(data))
    return int(math.floor(data / base) * base)


def ceil(data, base=None):
    """
    ceil
    :param data:
    :param base:
    :return:
    """
    if base is None or base == 0:
        return int(math.ceil(data))
    return int(math.ceil(data / base) * base)
