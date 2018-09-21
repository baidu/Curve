# -*- coding: utf-8 -*-
"""
    Model
    ~~~~
    data raw model

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from app import db
from .common import (
    auto_init,
    auto_repr,
    default_time
)


class Raw(db.Model):
    """
    point of data
    """
    __init__ = auto_init
    __repr__ = auto_repr
    data_id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.Float, nullable=True)
    label = db.Column(db.Integer, nullable=True)
    create_time = db.Column(db.Integer, default=default_time)
    update_time = db.Column(db.Integer, default=default_time, onupdate=default_time)

    def view(self, time_format):
        """
        render data raw for view
        :return:
        """
        return time_format.time2str(self.timestamp), self.value, self.label
