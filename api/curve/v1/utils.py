# -*- coding: utf-8 -*-
"""
    Util
    ~~~~
    common function and definition

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import time

import numpy as np

try:
    from StringIO import StringIO
except ImportError:
    from io import StringIO


def enum(**enums):
    """
    simple enum demo
    TODO
    :param enums: dict args of enums
    :return: An Enum
    """
    return type('Enum', (), enums)


E_LABEL = enum(normal=0, abnormal=1, unknown=-1)
E_PLUGIN_TYPE = enum(SINGLE=1, MULTI=0)


def mean(data, key=None):
    """
    mean with data type check
    :param data: points
    :param key: key function
    :return:
    """
    if key is not None:
        data = [key(point) for point in data]
    data = filter(lambda x: isinstance(x, (int, float, long)), data)
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


def encode_if_unicode(s):
    """
    encode string in unicode
    :param s:
    :return:
    """
    if isinstance(s, unicode):
        return s.encode('utf-8')
    return s


class TimeFormat(object):
    """
    time formatter
    """
    pass


class UnixTimeFormat(TimeFormat):
    """
    time formatter in unix timestamp
    """
    @staticmethod
    def time2str(timestamp):
        """
        strftime
        :param timestamp:
        :return:
        """
        return str(int(timestamp))

    @staticmethod
    def str2time(time_str):
        """
        strptime
        :param time_str:
        :return:
        """
        return int(time_str)


class ShortTimeFormat(TimeFormat):
    """
    time formatter in short str
    """
    time_format = '%Y%m%d%H%M%S'

    @staticmethod
    def time2str(timestamp):
        """
        strftime
        :param timestamp:
        :return:
        """
        return time.strftime(ShortTimeFormat.time_format, time.localtime(timestamp))

    @staticmethod
    def str2time(time_str):
        """
        strptime
        :param time_str:
        :return:
        """
        return int(time.mktime(time.strptime(time_str, ShortTimeFormat.time_format)))


class RFCTimeFormat(TimeFormat):
    """
    time formatter in rfc
    """
    time_format = '%Y-%m-%d %H:%M:%S'

    @staticmethod
    def time2str(timestamp):
        """
        strftime
        :param timestamp:
        :return:
        """
        return time.strftime(RFCTimeFormat.time_format, time.localtime(timestamp))

    @staticmethod
    def str2time(time_str):
        """
        strptime
        :param time_str:
        :return:
        """
        return int(time.mktime(time.strptime(time_str[:10] + ' ' + time_str[11:19], RFCTimeFormat.time_format)))


E_TIME_FORMATTER = enum(unix=UnixTimeFormat, short=ShortTimeFormat, rfc=RFCTimeFormat)
