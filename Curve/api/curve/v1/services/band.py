# -*- coding: utf-8 -*-
"""
    Service
    ~~~~
    band operations

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import threading
import urllib

from app import db
from v1.models import BandItem


class BandService(object):
    """
    band operations
    """
    _instance_lock = threading.Lock()
    _instance = {}

    def __new__(cls, *args, **kwargs):
        """
        single pattern
        :param args: args in construct
        :param kwargs: kwargs in construct
        :return:
        """
        data_id = None
        if len(args) > 0:
            data_id = args[0]
        if 'data_id' in kwargs:
            data_id = kwargs['data_id']
        if data_id is None:
            raise TypeError('__init__ argument data_name not found.')
        if data_id not in BandService._instance:
            with BandService._instance_lock:
                if data_id not in BandService._instance:
                    obj = super(BandService, cls).__new__(cls)
                    BandService.__init__(obj, data_id)
                    BandService._instance[data_id] = obj
        return BandService._instance[data_id]

    def __init__(self, data_id):
        """
        band service init
        :param data_id: selected data id
        """
        self.data_id = data_id

    def add_band(self):
        """
        add a band to selected data
        :return:
        """
        # TODO: not implement
        pass

    def get_band_names(self):
        """
        get all band names from database
        :return:
        """
        return db.session.query(BandItem.name.distinct()).filter_by(data_id=self.data_id).all()

    def get_band_count(self, band_name):
        """
        get count of band items from database
        :param band_name: the name of band items
        :return:
        """
        # TODO: sqlite3 with chinese field
        band_name = urllib.quote(band_name)
        band_count = BandItem.query.filter_by(
            data_id=self.data_id,
            name=band_name).\
            count()

        return band_count

    def get_band_item(self, band_name, index):
        """
        query band item by index
        :param band_name: the name of band items
        :param index: the index in the band init
        :return:
        """
        # TODO: sqlite3 with chinese field
        band_name = urllib.quote(band_name)
        band_item = BandItem.query.filter_by(
            data_id=self.data_id,
            name=band_name,
            index=index).\
            first()

        return band_item

    def get_band_items(self, band_name, start_time, end_time):
        """
        search band
        :param band_name:
        :param start_time:
        :param end_time:
        :return:[Band(start, end, reliability)]
        """
        # TODO: sqlite3 with chinese field
        band_name = urllib.quote(band_name)
        band_items = BandItem.query.filter(BandItem.data_id == self.data_id). \
            filter(BandItem.name == band_name). \
            filter(BandItem.start_time <= end_time). \
            filter(BandItem.end_time >= start_time). \
            order_by(BandItem.start_time). \
            all()

        return band_items
