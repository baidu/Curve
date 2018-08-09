# -*- coding: utf-8 -*-
"""
    Plugin
    ~~~~
    plugin operations

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import importlib
import inspect
import os
import types
import warnings

import numpy as np
from flask import current_app

from v1 import utils
from v1.utils import (
    E_LABEL,
    E_PLUGIN_TYPE
)


class DataMeta(object):
    """
    meta definition
    """

    def __init__(self, data):
        self.name = data.name
        self.start_time = data.start_time
        self.end_time = data.end_time
        self.period = data.period
        self.period_ratio = data.period_ratio
        self.label_ratio = data.label_ratio
        self.readable_timestamp = data.readable_timestamp


class PluginAPI(object):
    DAY = 86400
    WEEK = 604800

    E_LABEL = E_LABEL

    def __init__(self, data_service):
        self.data_service = data_service

    @property
    def LABEL_ENUM(self):
        """
        enum for labels
        :return:
        """
        warnings.warn("""
+++++++++++++++++++++++++++++++++++++++++++++++++
Usage of LABEL_ENUM is deprecated:
please use E_LABEL instead
+++++++++++++++++++++++++++++++++++++++++++++++++
""", DeprecationWarning, stacklevel=2)
        return self.E_LABEL

    def get_data(self, start_time=None, end_time=None):
        """
        get raw data
        :param start_time:
        :param end_time:
        :return: [(timestamp, value, label)]
        """
        return self.data_service.get_line(start_time, end_time)

    def get_raw(self):
        """
        get raw data
        :return: [(timestamp, value, label)]
        """
        return self.data_service.get_raw()

    def get_abstract(self):
        """
        get get_abstract of data
        :return:
        """
        return self.data_service.get_abstract()

    def get_period(self):
        """
        get period of data
        :return:
        """
        return self.data_service.get_abstract().period

    def get_meta(self):
        """
        get meta of data
        :return: Meta(name, start_time, end_time, period)
        """
        warnings.warn("""
+++++++++++++++++++++++++++++++++++++++++++++++++
Usage of get_meta is deprecated:
please use get_abstract instead
+++++++++++++++++++++++++++++++++++++++++++++++++
""", DeprecationWarning, stacklevel=2)
        return DataMeta(self.get_abstract())

    def set_label(self, start_time, end_time, label):
        """
        set label as normal or abnormal
        :param start_time:
        :param end_time:
        :param label: enum(MARK_ENUM.normal, MARK_ENUM.abnormal)
        :return:
        """
        return self.data_service.set_label(start_time, end_time, label)

    def add_bands(self, bands):
        """
        add a band
        :param bands: [(band_name, start_time, end_time, reliability)]
        :return:
        """
        warnings.warn("""
+++++++++++++++++++++++++++++++++++++++++++++++++
add band method is not implement now.
+++++++++++++++++++++++++++++++++++++++++++++++++
""", FutureWarning, stacklevel=2)
        return self.data_service.add_band(bands)


class Plugin(object):
    """
    plugin manager
    find, sort and invoke plugin
    """
    PLUGIN_TYPE = E_PLUGIN_TYPE
    PLUGIN_METHOD = {
        'y_axis': PLUGIN_TYPE.SINGLE,
        'sampling': PLUGIN_TYPE.SINGLE,
        'reference': PLUGIN_TYPE.MULTI,
        'init_band': PLUGIN_TYPE.MULTI,
        'menu': PLUGIN_TYPE.MULTI,
    }
    BEFORE_HOOK = '_before_'
    AFTER_HOOK = '_after_'

    plugin_dir = os.path.abspath(os.path.join(
        os.path.dirname(inspect.getfile(inspect.currentframe())),
        '../plugins'
    ))
    plugins = None
    menus = None
    cache = []

    def __init__(self, data_service):
        """
        init plugin with data_service
        :param data_service:
        """
        self.api = PluginAPI(data_service)

    @staticmethod
    def __get_plugins():
        if Plugin.plugins is None:
            Plugin.plugins = {}
            for plugin in os.listdir(Plugin.plugin_dir):
                if os.path.exists(os.path.join(Plugin.plugin_dir, plugin, "__init__.py")):
                    plugin_path = '.'.join([
                        current_app.root_path.split(os.sep)[-1],
                        'v1',
                        'plugins',
                        plugin
                    ])
                    plugin = importlib.import_module(plugin_path)
                    Plugin.plugins[plugin.__name__] = plugin
        return Plugin.plugins

    def _invoke(self, model, method, *args):
        try:
            before_method = Plugin.BEFORE_HOOK + method
            if before_method in Plugin.__dict__:
                args = getattr(Plugin, before_method)(*args)
            output = getattr(model, method)(self.api, *args)
            after_method = Plugin.AFTER_HOOK + method
            if after_method in Plugin.__dict__:
                output = getattr(Plugin, after_method)(*output)
            return output
        except Exception as e:
            current_app.logger.error(e)

    def __call__(self, method, *args):
        """
        invoke other method like sampling, etc
        :param method: method in str
        :param args: args to run
        :return:
        """
        # actions_in_menu is a list of user actions, E.g. ['cancel_label']
        actions_in_menu = [m[0] for m in Plugin.get_menus()]
        if method not in self.PLUGIN_METHOD.keys() + actions_in_menu:
            return None
        res = []
        for _, plugin in sorted(Plugin.__get_plugins().items()):
            if method not in plugin.__dict__:
                continue
            if not isinstance(plugin.__dict__[method], types.FunctionType):
                continue
            try:
                output = self._invoke(plugin, method, *args)
                if method in self.PLUGIN_METHOD \
                        and self.PLUGIN_METHOD[method] == self.PLUGIN_TYPE.MULTI:
                    res.append(output)
                else:
                    return output
            except Exception as e:
                current_app.logger.error(e)
        if method in self.PLUGIN_METHOD \
                and self.PLUGIN_METHOD[method] == self.PLUGIN_TYPE.SINGLE:
            return self._invoke(Plugin, method, *args)
        return res

    @staticmethod
    def y_axis(api, line):
        """
        default y_axis plugin
        :param api: plugin api before init
        :param line: data raws
        :return:
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

    @staticmethod
    def _after_y_axis(plugin_name, axis):
        assert isinstance(plugin_name, str)
        assert isinstance(axis, (tuple, list))
        for x in axis:
            assert isinstance(x, (float, int, long))
        return plugin_name, axis

    @staticmethod
    def sampling(api, line, target_amount):
        """
        default sampling plugin
        :param api: plugin api
        :param line: data raws
        :param target_amount: target amount of points
        :return:
        """
        # Assume timestamp, value, range is not nullable
        if len(line) > target_amount and len(line) > 2:
            period = api.get_abstract().period  # timestamp is marked as the start time of a period
            start_time = line[0][0]
            end_time = line[-1][0]
            amount = (end_time - start_time) / period  # point amount without sampling
            aggr_period = utils.iceil(amount, target_amount) / target_amount * period
            start_time = utils.ifloor(line[0][0], aggr_period)
            tmp = {timestamp: [] for timestamp in range(start_time, end_time + period, aggr_period)}
            for point in line:
                tmp[utils.ifloor(point[0], aggr_period)].append(point)
            line = [
                [timestamp, utils.mean(points, lambda x: x[1]), utils.mean(points, lambda x: x[2])]
                for timestamp, points in sorted(tmp.items())
            ]
        return 'default', line

    @staticmethod
    def _after_sampling(plugin_name, line):
        assert isinstance(plugin_name, str)
        line = [point for point in line if point]
        for idx, point in enumerate(line):
            assert isinstance(point, (list, tuple))
            if len(point) == 1:
                line[idx] = [point[0], None, None]
            if len(point) == 2:
                line[idx] = [point[0], point[1], None]
        line.sort()
        return plugin_name, line

    @staticmethod
    def _after_reference(plugin_name, line):
        assert isinstance(plugin_name, str)
        line = [point for point in line if point]
        for idx, point in enumerate(line):
            assert isinstance(point, (list, tuple))
            if len(point) == 1:
                line[idx] = [point[0], None, None]
            if len(point) == 2:
                line[idx] = [point[0], point[1], None]
        line.sort()
        return plugin_name, line

    @staticmethod
    def _after_init_band(plugin_name, bands):
        assert isinstance(plugin_name, str)
        for idx, band in enumerate(bands):
            assert isinstance(band, (list, tuple))
            assert len(band) > 1
            assert isinstance(band[0], (float, int, long))
            assert isinstance(band[1], (float, int, long))
            if len(band) == 2:
                bands[idx] = (None, band[0], band[1])
            if len(band) == 3:
                assert isinstance(band[2], (float, int, long))
        bands.sort()
        return plugin_name, bands

    @staticmethod
    def get_menus():
        """
        get menu list
        :return: [(action, menu_name)]
        """
        if Plugin.menus is None:
            Plugin.menus = []
            method = 'menus'
            for _, plugin in sorted(Plugin.__get_plugins().items()):
                if method not in plugin.__dict__:
                    continue
                if not isinstance(plugin.__dict__[method], types.FunctionType):
                    continue
                output = getattr(plugin, method)()
                if output is not None:
                    # TODO: unique id
                    Plugin.menus.extend(output)
        return Plugin.menus
