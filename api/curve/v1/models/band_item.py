# -*- coding: utf-8 -*-
"""
    Model
    ~~~~
    band item model

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from app import db
from .common import (
    auto_init,
    auto_repr
)


class BandItem(db.Model):
    """
    band for reference
    """
    __init__ = auto_init
    __repr__ = auto_repr
    data_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, primary_key=True)
    index = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.Integer)
    end_time = db.Column(db.Integer)
    # TODO: tooltips comment
    # comment = db.Column(db.Text)
    reliability = db.Column(db.Float, nullable=True)

    def _view(self):
        """
        render band item for view
        :return:
        """
        return {
            'bandNo': self.index,
            'currentTime': {
                'duration': {
                    'start': self.start_time * 1000,
                    'end': self.end_time * 1000
                },
                'show': {
                    'start': (2 * self.start_time - self.end_time) * 1000,
                    'end': (2 * self.end_time - self.start_time) * 1000
                },
            },
            'reliability': self.reliability,
        }

    def view(self, band_count, window):
        """
        render band item for view
        :param band_count: amount of selected band
        :param window: default view window
        :return:
        """
        res = self._view()
        res['currentTime']['show']['start'] = (self.start_time - window / 2) * 1000
        res['currentTime']['show']['end'] = (self.end_time - window / 2) * 1000
        res['bandCount'] = band_count
        return res
