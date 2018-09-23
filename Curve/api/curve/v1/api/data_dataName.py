# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

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

import pandas as pd

logger = utils.getLogger(__name__)

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

        # gets the uploaded csv file
        upload_file = request.files.values()[0]
        try:
            # parses the incoming csv into long format
            # points, time_formatter = self._parse_file(upload_file)  # parse data in csv
            points, time_formatter = self._parse_file_pd(upload_file)  # parse data in csv
        except Exception as e:
            return self.render(msg=e.message, status=422)
        if len(points) < 2:
            return self.render(msg='at least 2 point', status=422)


        timestamps = np.asarray(sorted(points.keys()))
        periods = np.diff(timestamps)
        period = int(np.median(periods))
        start_time = utils.ifloor(timestamps.min(), period)
        end_time = utils.ifloor(timestamps.max(), period) + period
        
        # # drop those points not divisible by period
        # data_raw = []  
        # data_raw_list = []
        # in_points = 0
        # for timestamp in range(start_time, end_time, period):
        #     if timestamp in points:
        #         point = points[timestamp]
        #         data_raw.append(
        #             Raw(timestamp=point[0], value=point[1], label=point[2]))
        #         data_raw_list.append((point[0], point[1], None))
        #         in_points += 1
        #     else:
        #         data_raw.append(Raw(timestamp=timestamp))
        #         data_raw_list.append((timestamp, None, None))

        
        # use raw points regardless of divisibility by period
        data_raw = []  
        data_raw_list = []
        for timestamp, point in points.iteritems():
            data_raw.append(
                Raw(timestamp=point[0], value=point[1], label=point[2]))
            data_raw_list.append((point[0], point[1], None))

        logger.debug("""
start_time: {},
end_time: {},
period: {}""".format(start_time, end_time, period))

        plugin = Plugin(data_service)
        try:
            _, (axis_min, axis_max) = plugin('y_axis', data_raw_list)  # cal y_axis for data
        except Exception as e:
            logger.error("Error implementing 'y_axis' plugin\nError: {}".format(e.message))
            raise e
    
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

        try:
            _, thumb = plugin('sampling', data_raw_list, config.SAMPLE_PIXELS)  # init thumb for data
        except Exception as e:
            logger.error("Error calling 'sampling' plugin\nError: {}".format(e.message))
            raise e

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
        points = {}
        reader = csv.reader(upload_file)
        formatter = None
        for line in reader:
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
                    msg = 'line %d: %s' % (reader.line_num, e.message)
                    current_app.logger.error(msg)
                    raise Exception(msg)
        return points, formatter

    def _parse_file_pd(self, upload_file):
        data = pd.read_csv(upload_file)
        if "timestamp" in data.columns.values and "value" in data.columns.values:
            final_data = pd.DataFrame({
                # put timestamp into unix timestamp
                "timestamp": pd.to_datetime(data["timestamp"], unit="ns").values.astype(np.int64),
                "value": data["value"].apply(self._parse_value),
            })
            if "label" in data.columns.values:
                final_data["label"] = data["label"].apply(self._parse_label)
            else:
                final_data["label"] = pd.Series([None for _ in xrange(len(final_data.value))])

        else:
            raise ValueError("Bad formatted data, data.columns.values: {}".format(data.columns.values))

        # raise ValueError("data shape, final_data shape: {}, {}".format(data.shape, final_data.shape))
        points = {}
        for i in xrange(final_data.shape[0]):
            row = final_data.iloc[i]
            points[row['timestamp']] = (
                row['timestamp'],
                row['value'],
                row['label']
            )

        logger.debug("""
len(points): {}
number points with not None value: {}""".format(len(points), len([k for k,v in points.iteritems() if v[1] is not None])))
        # TODO handle more than just unix timestamp
        formatter = E_TIME_FORMATTER.unix

        # points = final_data.to_dict('index')
        # points = {k : (v['timestamp'], v['value'], v['label']) for k,v in points.iteritems()}

        # points = {}
        # reader = csv.reader(upload_file)
        # formatter = None
        # for line in reader:
        #     if formatter is None:
        #         formatter = self._find_time_format(line[0])
        #     if formatter is not None:
        #         try:
        #             timestamp = formatter.str2time(line[0])
        #             value = None
        #             if len(line) > 1:
        #                 value = self._parse_value(line[1])
        #             label = None
        #             if len(line) > 2:
        #                 label = self._parse_label(line[2])
        #             points[timestamp] = (timestamp, value, label)
        #         except ValueError as e:
        #             msg = 'line %d: %s' % (reader.line_num, e.message)
        #             current_app.logger.error(msg)
        #             raise Exception(msg)
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
