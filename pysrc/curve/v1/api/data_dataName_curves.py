# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import urllib

from flask import g

from .base_api import Resource
from ..exception import DataNotFoundException
from ..models import Band
from ..models import db
from ..service import PluginManager
from ..service import DataService
from ..utils import LABEL_ENUM
from ..utils import s2ms


class DataDatanameCurves(Resource):
    """
    ref: web_api.yaml
    """

    def get(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        # parse params in request
        data_name = dataName
        if isinstance(data_name, unicode):
            data_name = data_name.encode('utf-8')
        try:
            data_service = DataService(data_name)
        except DataNotFoundException:
            return self.render(msg='%s not found' % data_name), 404, None
        plugin = PluginManager(data_service)
        start_time = g.args['startTime'] / 1000
        end_time = g.args['endTime'] / 1000
        # get raw
        line = data_service.get_data(start_time, end_time)
        # get base line
        raw_line = self.__get_raw(plugin, line)
        # get label line
        label_line = self.__get_label(plugin, line, raw_line)
        # get refs
        ref_lines, y_axis_ref = self.__get_refs(plugin, line)
        # cal y axis
        y_axis = [float('inf'), float('-inf')]
        values = [point[1] for point in line if point[1] is not None]
        if len(values) > 0:
            y_axis[1] = max(y_axis[1], max(values))
            y_axis[0] = min(y_axis[1], min(values))
        y_axis[1] = max(y_axis[1], y_axis_ref[1])
        y_axis[0] = max(y_axis[0], y_axis_ref[0])
        y_axis = self.__y_axis_filter(y_axis)
        # get bands
        bands, band_lines = self.__get_bands(data_service, start_time, end_time, line, y_axis)
        # make trends for web front-end
        trends = [raw_line] + [label_line] + ref_lines + band_lines

        return self.render(data={
            'trends': trends,
            'bands': bands,
            'yAxis': y_axis
        }), 200, None

    def __y_axis_filter(self, y_axis):
        # TODO: yAxis plugin
        if y_axis[1] == float('-inf'):
            y_axis[1] = 0
        if y_axis[0] == float('inf'):
            y_axis[0] = 0
        length = y_axis[1] - y_axis[0]
        if y_axis[1] != 100:
            y_axis[1] += 0.1 * length
        if y_axis[0] != 0:
            y_axis[0] -= 0.1 * length
        return y_axis

    def __get_raw(self, plugin, line):
        raw_line = [point[:2] for point in line]
        _, raw_line = plugin('sampling', raw_line, 1000)
        raw_line = s2ms(raw_line)
        raw_line = {
            'name': 'base line',
            'type': 'line',
            'data': raw_line
        }
        return raw_line

    def __get_label(self, plugin, line, raw_line):
        label_line = [(point[0], point[2]) for point in line]
        _, label_line = plugin('sampling', label_line, 1000)
        for key, point in enumerate(label_line):
            if point[1] == LABEL_ENUM.abnormal:
                label_line[key] = raw_line['data'][key]
            else:
                label_line[key] = (raw_line['data'][key][0], None)
        label_line = {
            'name': 'label line',
            'type': 'line',
            'data': label_line
        }
        return label_line

    def __get_refs(self, plugin, line):
        y_axis = [float('inf'), float('-inf')]
        refs = plugin('reference', line)
        ref_lines = []
        for ref_name, ref in refs:
            if len(ref) > 0 and len(ref[0]) == 2:
                ref_type = 'line'
                values = [point[1] for point in ref if point[1] is not None]
            elif len(ref) > 0 and len(ref[0]) == 3:
                ref_type = 'arearange'
                values = [point[1] for point in ref if point[1] is not None] + \
                         [point[2] for point in ref if point[2] is not None]
            else:
                continue
            if len(values) > 0:
                y_axis[1] = max(y_axis[1], max(values))
                y_axis[0] = min(y_axis[0], min(values))
            ref_lines.append({
                'name': ref_name,
                'type': ref_type,
                'data': ref
            })
        return ref_lines, y_axis

    def __get_bands(self, data_service, start_time, end_time, line, y_axis):
        bands = []
        band_lines = []
        band_names = db.session.query(db.distinct(Band.name)).all()
        period = data_service.get_meta().period
        for band_name, in band_names:
            # render bands for colored square
            band_name = urllib.unquote(band_name.encode('utf-8'))
            band_items = data_service.get_band(band_name, start_time, end_time)
            tmp = set([])
            for band in band_items:
                for x in range(band.start_time, band.end_time + period, period):
                    tmp.add(x)
            band_line = []
            for point in line:
                if point[0] in tmp:
                    band_line.append([point[0], y_axis[1]])
                else:
                    band_line.append([point[0], None])
            band_lines.append({
                'name': band_name,
                'type': 'area',
                'data': s2ms(band_line)
            })
            # band tooltip render
            for band_no, band in enumerate(band_items):
                band_items[band_no] = {
                    'bandNo': band.index,
                    'bandCount': len(band_items),
                    'currentTime': {
                        'duration': {
                            'start': band.start_time * 1000,
                            'end': band.end_time * 1000
                        },
                        'show': {
                            'start': (band.start_time - (start_time - end_time) / 2) * 1000,
                            'end': (band.end_time + (start_time - end_time) / 2) * 1000
                        },
                    },
                    'reliability': band.reliability
                }
            for band_no, band in enumerate(band_items):
                if band_no - 1 > -1:
                    band_items[band_no - 1]['nextTime'] = band['currentTime']['show']
                if band_no + 1 < len(band_items):
                    band_items[band_no + 1]['preTime'] = band['currentTime']['show']
            bands.append({
                'name': band_name,
                'bands': band_items
            })
        return bands, band_lines
