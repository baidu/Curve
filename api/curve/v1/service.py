# -*- coding: utf-8 -*-
"""
    Service
    ~~~~
    data operations

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import json
import urllib
import importlib
import inspect
import os
from os import path
from types import FunctionType

from flask import current_app
from sqlalchemy.orm.exc import NoResultFound

from .exception import DataNotFoundException
from .exception import UnprocessableException
from .models import Band
from .models import Data
from .models import db
from .models import Point
from .models import Thumb
from .utils import enum
from .utils import ceil
from .utils import floor
from .utils import LABEL_ENUM


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


class DataService(object):
    """
    data operations
    """

    def __init__(self, data_name, meta=None, points=None):
        self.data_name = data_name
        self.cache = {}
        self.points = None
        if meta is not None and (isinstance(meta, DataMeta) or isinstance(meta, Data)):
            self.data = meta
        else:
            try:
                self.data = Data.query.filter_by(name=self.data_name).one()
            except NoResultFound:
                raise DataNotFoundException()
        if points is not None:
            self.points = points

    @staticmethod
    def list(pattern=None):
        """
        list all datas
        :param pattern:
        :return: [DataMeta]
        """
        if pattern:
            return Data.query. \
                filter(db.text("name like :name")). \
                params(name='%%%s%%' % pattern). \
                order_by(Data.name). \
                all()
        return Data.query.order_by(Data.name).all()

    @staticmethod
    def exists(data_name):
        """
        check data is exist or not
        :param data_name:
        :return:
        """
        try:
            Data.query.filter_by(name=data_name).one()
        except NoResultFound:
            return False
        return True

    def get_meta(self):
        """
        get meta of data
        :return: meta
        """
        return DataMeta(self.data)

    def get_data(self, start_time=None, end_time=None):
        """
        get raw data
        :param start_time:
        :param end_time:
        :return: [(timestamp, value, label)]
        """
        if 'data' not in self.cache:
            if start_time is None or start_time < self.data.start_time:
                start_time = self.data.start_time
            if end_time is None or end_time > self.data.end_time:
                end_time = self.data.end_time
            if self.points is not None:
                points = [
                    point
                    for point in self.points
                    if start_time <= point.timestamp <= end_time
                ]
            else:
                points = Point.query.filter(db.and_(
                    Point.data_name.is_(self.data_name),
                    Point.timestamp.between(start_time, end_time)
                )).all()
                if start_time <= self.data.start_time and end_time >= self.data.end_time:
                    self.points = points
            line = [[point.timestamp, point.value, point.label] for point in points]
            timestamps = {point.timestamp for point in points}
            for timestamp in range(
                    ceil(start_time, self.data.period),
                    floor(end_time, self.data.period), self.data.period
            ):
                if timestamp not in timestamps:
                    line.append([timestamp, None, None])
            self.cache['data'] = sorted(line)

        return self.cache['data']

    def get_line(self, start_time=None, end_time=None):
        """
        get curves
        :param start_time:
        :param end_time:
        :return: [(timestamp, value)]
        """
        if 'line' not in self.cache:
            if start_time is None or start_time < self.data.start_time:
                start_time = self.data.start_time
            if end_time is None or end_time > self.data.end_time:
                end_time = self.data.end_time
            if self.points is not None:
                points = [
                    point
                    for point in self.points
                    if start_time <= point.timestamp <= end_time
                ]
            else:
                points = Point.query.filter(db.and_(
                    Point.data_name.is_(self.data_name),
                    Point.timestamp.between(start_time, end_time)
                )).all()
                if start_time <= self.data.start_time and end_time >= self.data.end_time:
                    self.points = points
            line = [[point.timestamp, point.value] for point in points]
            timestamps = {point.timestamp for point in points}
            for timestamp in range(
                    floor(start_time, self.data.period),
                    floor(end_time, self.data.period), self.data.period
            ):
                if timestamp not in timestamps:
                    line.append([timestamp, None])
            self.cache['line'] = sorted(line)

        return self.cache['line']

    def get_label(self, start_time=None, end_time=None):
        """
        get label curves
        :param start_time:
        :param end_time:
        :return: [(timestamp, value)]
        """
        if 'label' not in self.cache:
            if start_time is None or start_time < self.data.start_time:
                start_time = self.data.start_time
            if end_time is None or end_time > self.data.end_time:
                end_time = self.data.end_time
            if self.points is not None:
                points = [
                    point
                    for point in self.points
                    if start_time <= point.timestamp <= end_time
                ]
            else:
                points = Point.query.filter(db.and_(
                    Point.data_name.is_(self.data_name),
                    Point.timestamp.between(start_time, end_time),
                    Point.label.isnot(LABEL_ENUM.normal)
                )).all()
                if start_time <= self.data.start_time and end_time >= self.data.end_time:
                    self.points = points
            line = [[point.timestamp, point.value] for point in points]
            timestamps = {point.timestamp for point in points}
            for timestamp in range(
                    floor(start_time, self.data.period),
                    floor(end_time, self.data.period), self.data.period
            ):
                if timestamp not in timestamps:
                    line.append([timestamp, None])
            self.cache['label'] = sorted(line)

        return self.cache['label']

    def get_thumb(self):
        """
        get thumb line
        :return: [(timestamp, value)...]
        """
        if 'thumb' not in self.cache or self.cache['thumb'] is None:
            thumb = None
            try:
                row = Thumb.query.filter_by(data_name=self.data_name).one()
                if row is not None:
                    thumb = json.loads(row.thumb)
            except NoResultFound:
                pass
            if thumb is None:
                line = self.get_line()
                _, thumb = PluginManager(self)('sampling', line, 1000)
                db.session.add(Thumb(self.data_name, json.dumps(thumb)))
                db.session.commit()
            self.cache['thumb'] = thumb
        return self.cache['thumb']

    def set_label(self, start_time, end_time, label):
        """
        mark point as normal or abnormal
        :param start_time:
        :param end_time:
        :param label:
        """
        if label != LABEL_ENUM.normal and label != LABEL_ENUM.abnormal:
            raise UnprocessableException('invalid label')
        if start_time is None or start_time < self.data.start_time:
            start_time = self.data.start_time
        if end_time is None or end_time > self.data.end_time:
            end_time = self.data.end_time
        Point.query.filter(db.and_(
            Point.data_name.is_(self.data_name),
            Point.timestamp.between(start_time, end_time)
        )).update({Point.label: label}, synchronize_session=False)
        db.session.commit()
        Data.query.filter_by(name=self.data_name).update({
            Data.label_ratio:
                Point.query.filter_by(data_name=self.data_name, label=LABEL_ENUM.abnormal).count() * 1.
                / Point.query.filter_by(data_name=self.data_name).count()
        })
        db.session.commit()

    def count_bands(self, band_name):
        """
        count bands
        :param band_name:
        :return:
        """
        return Band.query.filter_by(data_name=self.data_name, name=urllib.quote(band_name)).count()

    def get_band(self, band_name, start_time=None, end_time=None):
        """
        search band
        :param band_name:
        :param start_time:
        :param end_time:
        :return:[Band(start, end, reliability)]
        """
        band_name = urllib.quote(band_name)
        query = Band.query.filter_by(data_name=self.data_name, name=band_name)
        if start_time is not None:
            query = query.filter(Band.end_time > start_time)
        if end_time is not None:
            query = query.filter(Band.start_time < end_time)
        order = Band.start_time
        bands = query.order_by(order).all()

        return bands

    def add_band(self, bands):
        """
        add band
        :param bands: [(band_name, start_time, end_time, reliability)]
        """
        for band_no, (band_name, start_time, end_time, reliability) in enumerate(bands):
            db.session.add(Band(self.data_name, band_name, start_time, end_time, reliability, band_no + 1))
        db.session.commit()

    def delete(self):
        """
        delete data, include meta, point and band
        """
        Data.query.filter_by(name=self.data_name).delete(synchronize_session=False)
        Point.query.filter_by(data_name=self.data_name).delete(synchronize_session=False)
        Band.query.filter_by(data_name=self.data_name).delete(synchronize_session=False)
        Thumb.query.filter_by(data_name=self.data_name).delete(synchronize_session=False)
        db.session.commit()


class PluginManager(object):
    """
    plugin manager
    find, sort and invoke plugin
    """

    PLUGIN_TYPE = enum(SINGLE=1, MULTI=0)
    PLUGIN_METHOD = {
        # TODO: more and more
        'sampling': PLUGIN_TYPE.SINGLE,
        'reference': PLUGIN_TYPE.MULTI,
        'init_band': PLUGIN_TYPE.MULTI,
        'menu': PLUGIN_TYPE.MULTI,
    }
    __ins = None
    plugin_dir = path.abspath(path.join(
        path.dirname(inspect.getfile(inspect.currentframe())),
        'plugins'
    ))
    plugins = None
    menus = None

    def __init__(self, data):
        self.api = API(data)

    @staticmethod
    def __get_plugins():
        if PluginManager.plugins is None:
            PluginManager.plugins = {}
            for plugin in os.listdir(PluginManager.plugin_dir):
                if path.exists(path.join(PluginManager.plugin_dir, plugin, "__init__.py")):
                    plugin_path = '.'.join([
                        current_app.root_path.split(os.sep)[-1],
                        'v1',
                        'plugins',
                        plugin
                    ])
                    plugin = importlib.import_module(plugin_path)
                    PluginManager.plugins[plugin.__name__] = plugin
        return PluginManager.plugins

    def __call__(self, method, *args):
        res = []
        if method in self.PLUGIN_METHOD \
                or method in [menu[0] for menu in PluginManager.get_menus()]:
            if method not in self.PLUGIN_METHOD \
                    or self.PLUGIN_METHOD[method] == self.PLUGIN_TYPE.SINGLE:
                for _, plugin in sorted(PluginManager.__get_plugins().items()):
                    if method in plugin.__dict__ \
                            and isinstance(plugin.__dict__[method], FunctionType):
                        return getattr(plugin, method)(self.api, *args)
            else:
                for _, plugin in sorted(PluginManager.__get_plugins().items()):
                    if method in plugin.__dict__ \
                            and isinstance(plugin.__dict__[method], FunctionType):
                        output = getattr(plugin, method)(self.api, *args)
                        if output is not None:
                            res.append(output)
        return res

    @staticmethod
    def get_menus():
        """
        get menu list
        :return:
        """
        if PluginManager.menus is None:
            PluginManager.menus = []
            method = 'menus'
            for _, plugin in sorted(PluginManager.__get_plugins().items()):
                if method in plugin.__dict__ and isinstance(plugin.__dict__[method], FunctionType):
                    output = getattr(plugin, method)()
                    if output is not None:
                        PluginManager.menus.extend(output)
        return PluginManager.menus


# TODO: modify to PluginAPI
class API(object):
    """
    api for plugins
    """

    DAY = 86400
    WEEK = 604800
    LABEL_ENUM = LABEL_ENUM

    def __init__(self, data):
        if isinstance(data, str):
            self.data_name = data
            self.data_service = DataService(data)
        elif isinstance(data, DataService):
            self.data_name = data.get_meta().name
            self.data_service = data
        else:
            raise DataNotFoundException

    def get_data(self, start_time=None, end_time=None):
        """
        get raw data
        :param start_time:
        :param end_time:
        :return: [(timestamp, value, label)]
        """
        return self.data_service.get_line(start_time, end_time)

    def get_meta(self):
        """
        get meta of data
        :return: Meta(name, start_time, end_time, period)
        """
        return self.data_service.get_meta()

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
        return self.data_service.add_band(bands)
