# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import io
import csv
import json
import re

import numpy as np
from flask import (
    request,
    current_app,
    g
)

from .resource import Resource
from v1 import utils
from v1.models import (
    Raw,
    DataAbstract,
    Thumb
)
from v1.services import (
    DataService,
    Plugin
)
from v1.utils import (
    StringIO,
    E_LABEL,
    E_TIME_FORMATTER
)
import config


class DataDataname(Resource):
    """
    ref: web_api.yaml
    """
    csv_header = ['timestamp', 'value', 'label']
    normal_mark = {str(E_LABEL.normal)}
    unknown_mark = {None, '', str(E_LABEL.unknown)}

    def get(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        if not data_service.exists():
            return self.render(msg='%s not found' % data_name, status=404)
        if not data_service.auth_read():
            return self.render(msg='%s: data access forbidden' % data_name, status=403)
        data_abstract = data_service.get_abstract()
        data_raw = data_service.get_raw()
        time_format = getattr(utils, data_abstract.time_formatter)
        data_raw = [raw.view(time_format) for raw in data_raw]
        string_io = StringIO()
        writer = csv.writer(string_io)
        writer.writerow(self.csv_header)
        writer.writerows(data_raw)

        return self.render_file('%s.csv' % data_name, string_io.getvalue())

    def post(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        if data_service.exists():
            return self.render(msg='%s is exists' % data_name, status=422)
        if len(request.files) < 1:
            return self.render(msg='expect file input', status=422)
        upload_file = request.files['file']
        current_app.logger.info('Info: %s %s %s', request.files['file'], request.files, request.files['file'].filename)
        try:
            points, time_formatter = self._parse_file(upload_file)  # parse data in csv
        except Exception as e:
            return self.render(msg=str(e), status=422)
        if len(points) < 2:
            return self.render(msg='at least 2 point', status=422)
        timestamps = np.asarray(sorted(points.keys()))
        periods = np.diff(timestamps)
        #current_app.logger.info('Periods as numpy %s', points.keys())
        period = int(np.median(periods))
        start_time = utils.ifloor(timestamps.min(), period)
        end_time = utils.ifloor(timestamps.max(), period) + period
        data_raw = []  # drop those points not divisible by period
        data_raw_list = []
        for timestamp in range(start_time, end_time, period):
            if timestamp in points:
                point = points[timestamp]
                data_raw.append(
                    Raw(timestamp=point[0], value=point[1], label=point[2]))
                data_raw_list.append((point[0], point[1], None))
            else:
                data_raw.append(Raw(timestamp=timestamp))
                data_raw_list.append((timestamp, None, None))
        plugin = Plugin(data_service)
        #for item in data_raw_list:
        #    current_app.logger.info('GOTCHA +++++ %s', item )
        _, (axis_min, axis_max) = plugin('y_axis', data_raw_list)  # cal y_axis for data
        current_app.logger.info('iRETURNED +++++ %d %d', axis_min, axis_max )
        data_abstract = DataAbstract(  # save abstract for data
            start_time=start_time,
            end_time=end_time,
            y_axis_min=axis_min,
            y_axis_max=axis_max,
            period=period,
            period_ratio=len(periods[periods == period]) * 1. / len(periods),
            label_ratio=sum([1 for point in data_raw if point.label]) * 1. / len(data_raw),
            time_formatter=time_formatter.__name__
        )
        data_service.abstract = data_abstract
        _, thumb = plugin('sampling', data_raw_list, config.SAMPLE_PIXELS)  # init thumb for data
        thumb = Thumb(thumb=json.dumps({
            'msg': 'OK',
            'server': request.host,
            'traceId': '',
            'data': {
                'data': [(point[0] * 1000, point[1]) for point in thumb],
                'name': 'thumb',
                'type': 'line'
            }
        }, ensure_ascii=False))
        refs = plugin('reference', data_raw_list)  # init ref for data
        bands = plugin('init_band', data_raw_list)  # init band
        data_service.set(data_abstract, data_raw, thumb, refs, bands)
        return self.render(
            data=data_service.get_abstract().view(),
            status=201,
            header={'Location': '/v1/data/%s' % data_name}
        )

    def _parse_file(self, upload_file):
        
        current_app.logger.info('Info: Loading file %s', str(upload_file))
        points = {}
        stream = io.StringIO(upload_file.stream.read().decode("UTF8"),newline=None)
        current_app.logger.info('Info: Loading file %s', stream)
        reader = csv.reader(stream)
        formatter = None
        for line in reader:
            #current_app.logger.info('%s %s, %s', line[0], line[1], line[2])
            if formatter is None:
                formatter = self._find_time_format(line[0])
            if formatter is not None:
                try:
                    timestamp = formatter.str2time(line[0])
                    value = None
                    if len(line) > 1:
                        value = self._parse_value(line[1])
                    label = None
                    if len(line) > 2:
                        label = self._parse_label(line[2])
                    points[timestamp] = (timestamp, value, label)
                except ValueError as e:
                    msg = 'line %d: %s' % (reader.line_num, str(e))
                    current_app.logger.error(msg)
                    raise Exception(msg)
        return points, formatter

    def put(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        if not data_service.exists():
            return self.render(msg='%s not found' % data_name, status=404)
        if not data_service.auth_edit():
            return self.render(msg='%s: data access forbidden' % data_name, status=403)
        plugin = Plugin(data_service)

        start_time = g.args['startTime'] / 1000
        end_time = g.args['endTime'] / 1000
        action = g.args['action']

        res = plugin(action, start_time, end_time)

        return self.render(data=res)

    def delete(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        if not data_service.exists():
            return self.render(msg='%s not found' % data_name, status=404)
        if not data_service.auth_edit():
            return self.render(msg='%s: data access forbidden' % data_name, status=403)
        data_service.delete()
        return self.render()

    @staticmethod
    def _find_time_format(time_str):
        # for format XXXXXXXXXXX.0
        split_index = time_str.find('.')
        if split_index != -1:
            time_str = time_str[:split_index]
        if re.match(r'^\d+$', time_str):
            # TODO: find different between YYYYmmddHHMMSS and UNIX_ms
            if len(time_str) > 11:
                # YYYYmmddHHMMSS
                return E_TIME_FORMATTER.short
            else:
                # UNIX_s
                return E_TIME_FORMATTER.unix
        elif re.match(r'\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}', time_str):
            # YYYY-mm-dd HH:MM:SS
            return E_TIME_FORMATTER.rfc
        return None

    @staticmethod
    def _parse_value(value):
        if value == '':
            return None
        return float(value)

    @staticmethod
    def _parse_label(label):
        if label in DataDataname.unknown_mark:
            return None
        if label not in DataDataname.normal_mark:
            return E_LABEL.abnormal
        return E_LABEL.normal
