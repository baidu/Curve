# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import urllib

from flask import g

import config
from .resource import Resource
from v1 import utils
from v1.utils import E_LABEL
from v1.services import DataService, BandService
from v1.services.plugin import Plugin


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
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        if not data_service.exists():
            return self.render(msg='%s not found' % data_name, status=404)
        if not data_service.auth_read():
            return self.render(msg='%s: data access forbidden' % data_name, status=403)
        plugin = Plugin(data_service)
        start_time = g.args['startTime'] / 1000
        end_time = g.args['endTime'] / 1000
        # get raw
        line = data_service.get_line(start_time, end_time)
        # get base line
        base_line = self._get_raw(plugin, line)
        # get label line
        label_line = self._get_label(line, base_line['data'])
        # get ref
        ref_lines = self._get_refs(data_service, plugin, start_time, end_time)
        # get band
        bands, band_lines = self._get_bands(data_service, base_line['data'], start_time, end_time)

        trends = [base_line, label_line] + ref_lines + band_lines
        return self.render(data={
            'trends': trends,
            'bands': bands,
            'yAxis': data_service.get_y_axis()
        })

    def _get_raw(self, plugin, line):
        line = [(point.timestamp, point.value, None) for point in line]
        _, base_line = plugin('sampling', line, config.SAMPLE_PIXELS)
        return {
            'name': 'base line',
            'type': 'line',
            'data': [(point[0] * 1000, point[1]) for point in base_line]
        }

    def _get_label(self, line, base_line):
        label_line = [[timestamp, None] for timestamp, _ in base_line]
        idx = 0
        for raw in line:
            if raw.label == E_LABEL.abnormal:
                while idx + 1 < len(label_line) and label_line[idx + 1][0] <= raw.timestamp * 1000:
                    idx += 1
                label_line[idx][1] = base_line[idx][1]
        return {
            'name': 'label line',
            'type': 'line',
            'data': label_line
        }

    def _get_refs(self, data_service, plugin, start_time, end_time):
        tmp = data_service.get_ref(start_time, end_time)
        ref_lines = []
        for ref_name, ref_line in tmp:
            ref = {'name': urllib.unquote(ref_name.encode('utf-8')), 'type': 'line', 'data': None}
            _, ref_line = plugin('sampling', ref_line, config.SAMPLE_PIXELS)
            is_area = False
            for point in ref_line:
                if point[2] is not None:
                    is_area = True
            if is_area:
                ref['type'] = 'arearange'
                ref['data'] = [
                    (point[0] * 1000, point[1] - point[2], point[1] + point[2])
                    for point in ref_line if point[1] is not None and point[2] is not None
                ]
            else:
                ref['data'] = [
                    (point[0] * 1000, point[1])
                    for point in ref_line if point[1] is not None
                ]
            ref_lines.append(ref)
        return ref_lines

    def _get_bands(self, data_service, base_line, start_time, end_time):
        band_service = BandService(data_service.get_id())
        band_names = band_service.get_band_names()
        window = end_time - start_time
        # use aggr period
        period = data_service.get_period()
        y_axis_max = data_service.get_abstract().y_axis_max
        bands, lines = [], []
        for band_name, in band_names:
            band_name = urllib.unquote(band_name)
            band_items = band_service.get_band_items(band_name, start_time, end_time)
            band = {'name': band_name, 'bands': []}
            line = {'name': band_name, 'type': 'area', 'data': []}
            if len(band_items) == 0:
                bands.append(band)
                lines.append(line)
                continue
            tmp = set([])
            for band_item in band_items:
                for x in range(
                        utils.iceil(band_item.start_time, period) - period / 2,
                        utils.ifloor(band_item.end_time, period) + period / 2,
                        period):
                    tmp.add(x)
            for timestamp in range(
                    utils.iceil(start_time, period) - period / 2,
                    utils.ifloor(end_time, period) + period / 2,
                    period):
                if timestamp in tmp:
                    line['data'].append([timestamp * 1000, y_axis_max])
                else:
                    line['data'].append([timestamp * 1000, None])
            lines.append(line)
            band_count = band_service.get_band_count(band_name)
            pre_band = band_service.get_band_item(band_name, band_items[0].index - 1)
            next_band = band_service.get_band_item(band_name, band_items[-1].index - 1)
            band_items = [band_item.view(band_count, window) for band_item in band_items]
            for x in range(1, len(band_items) - 1):
                band_items[x]['preTime'] = band_items[x - 1]['currentTime']['show']
                band_items[x]['nextTime'] = band_items[x + 1]['currentTime']['show']
            if pre_band:
                band_items[0]['preTime'] = pre_band.view(band_count, window)['currentTime']['show']
            if pre_band:
                band_items[0]['nextTime'] = next_band.view(band_count, window)['currentTime']['show']
            band['bands'] = band_items
        return bands, lines
