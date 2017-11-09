# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import csv
import time
import urllib
import json

try:
    from StringIO import StringIO
except ImportError:
    from io import StringIO

from flask import request
from flask import g

from ..exception import DataNotFoundException
from ..models import Band
from ..models import Data
from ..models import db
from ..models import Point
from ..models import Thumb
from ..schemas import base_path
from ..service import DataService
from ..service import PluginManager
from ..utils import floor
from ..utils import LABEL_ENUM
from ..utils import parse_label
from ..utils import str2time
from ..utils import time2str
from .base_api import Resource


class DataDataname(Resource):
    """
    ref: web_api.yaml
    """

    def get(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = dataName
        if isinstance(data_name, unicode):
            data_name.encode('utf-8')
        try:
            string_io = StringIO()
            data_service = DataService(data_name)
            data = data_service.get_data()
            if data_service.get_meta().readable_timestamp:
                for key, point in enumerate(data):
                    data[key][0] = time2str(data[key][0])
            csv.writer(string_io).writerows([['timestamp', 'value', 'label']] + data)

            return self.render_file('%s.csv' % data_name, string_io.getvalue())
        except DataNotFoundException:
            return self.render(msg='%s not found' % data_name), 404, None

    def post(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = dataName
        if isinstance(data_name, unicode):
            data_name.encode('utf-8')
        if DataService.exists(data_name):
            return self.render(msg='%s is exists' % data_name), 422, None
        for upload_file in request.files.values():
            line_no = 0
            points = []
            try:
                reader = csv.reader(upload_file)
                readable_timestamp = False
                try:
                    line = reader.next()
                    points.append(self.__parse_point(data_name, line))
                    if len(line[0]) == 14:
                        readable_timestamp = True
                except ValueError:
                    pass
                for line in reader:
                    line_no += 1
                    points.append(self.__parse_point(data_name, line))
                    if len(line[0]) == 14:
                        readable_timestamp = True
            except Exception as e:
                return self.render(msg='line %d: %s' % (line_no, e.message)), 422, {}
            if len(points) < 2:
                return self.render(msg='at least 2 point'), 422, {}
            for point in points:
                db.session.add(point)
            timestamps = sorted([point.timestamp for point in points])
            periods = sorted([
                timestamps[x + 1] - timestamps[x]
                for x in range(len(timestamps) - 1)
            ])
            period = periods[len(periods) / 2]
            period_ratio = sum([1 for x in periods if x == period]) * 1. / len(periods)
            start_time = min(timestamps)
            end_time = max(timestamps) + period
            data = Data(
                data_name,
                start_time=start_time,
                end_time=end_time,
                period=period,
                period_ratio=period_ratio,
                label_ratio=sum([1 for point in points if point.label]) * 1. / len(points),
                create_time=int(time.time()),
                update_time=int(time.time()),
                readable_timestamp=readable_timestamp
            )
            db.session.add(data)
            # band
            data_service = DataService(data_name, data, points)
            plugin = PluginManager(data_service)
            for band_name, bands in plugin('init_band'):
                # TODO: sqlite3 with chinese field
                band_name = urllib.quote(band_name)
                bands = [
                    Band(data_name, band_name, band_start, band_end, 0.5, band_no + 1)
                    for band_no, (band_start, band_end) in enumerate(bands)
                ]
                for band in bands:
                    db.session.add(band)
            # thumb
            line = [[point.timestamp, point.value] for point in points]
            timestamps = {point.timestamp for point in points}
            for timestamp in range(floor(start_time, period), floor(end_time, period), period):
                if timestamp not in timestamps:
                    line.append([timestamp, None])
            _, thumb = plugin('sampling', sorted(line), 1000)
            thumb = Thumb(data_name, json.dumps(thumb))
            db.session.add(thumb)
            db.session.commit()
            data = DataService(data_name).data

            return self.render(data={
                "id": data.id,
                "name": data.name,
                "uri": '/v1/data/%s' % data.name,
                "createTime": data.create_time * 1000,
                "updateTime": data.update_time * 1000,
                "labelRatio": data.label_ratio,
                "period": {
                    "length": data.period,
                    "ratio": data.period_ratio
                },
                "time": {
                    "start": data.start_time * 1000,
                    "end": data.end_time * 1000
                }
            }), 201, {'Location': '%s/data/%s' % (base_path, data_name)}

        return self.render(msg='expect file input'), 422, None

    def __parse_point(self, data_name, line):
        if len(line) > 2:
            return Point(data_name, str2time(line[0]), float(line[1]), parse_label(line[2]))
        elif len(line) > 1:
            return Point(data_name, str2time(line[0]), float(line[1]), LABEL_ENUM.normal)

    def put(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = dataName
        if isinstance(data_name, unicode):
            data_name.encode('utf-8')
        data_service = DataService(data_name)
        plugin = PluginManager(data_service)

        start_time = g.args['startTime'] / 1000
        end_time = g.args['endTime'] / 1000
        action = g.args['action']

        res = plugin(action, start_time, end_time)

        return self.render(data=res), 200, None

    def delete(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = dataName
        if isinstance(data_name, unicode):
            data_name.encode('utf-8')
        try:
            DataService(data_name).delete()
            return self.render(), 200, None
        except DataNotFoundException:
            return self.render(msg='%s not found' % data_name), 404, None
