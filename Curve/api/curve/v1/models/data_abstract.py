# -*- coding: utf-8 -*-
"""
    Model
    ~~~~
    data abstract model

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import urllib

from app import db
from .common import (
    auto_init,
    auto_repr,
    current_user,
    default_time
)


class DataAbstract(db.Model):
    """
    meta of data
    """
    __init__ = auto_init
    __repr__ = auto_repr
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String)
    start_time = db.Column(db.Integer)
    end_time = db.Column(db.Integer)
    y_axis_max = db.Column(db.Float)
    y_axis_min = db.Column(db.Float)
    period = db.Column(db.Integer)
    period_ratio = db.Column(db.Float)
    label_ratio = db.Column(db.Float)
    time_formatter = db.Column(db.String)
    create_time = db.Column(db.Integer, default=default_time)
    update_time = db.Column(db.Integer, default=default_time, onupdate=default_time)
    owner = db.Column(db.String, default=current_user)
    public_read = db.Column(db.Boolean, default=False)
    public_edit = db.Column(db.Boolean, default=False)

    def view(self):
        """
        render data abstract for view
        :return:
        """
        return {
            'id': self.id,
            'name': urllib.unquote(self.name.encode('utf-8')),
            'uri': '/v1/data/%s' % urllib.unquote(self.name.encode('utf-8')),
            'createTime': self.create_time * 1000,
            'updateTime': self.update_time * 1000,
            'labelRatio': self.label_ratio,
            'period': {
                'length': self.period,
                'ratio': self.period_ratio
            },
            'display': {
                'start': self.start_time * 1000,
                'end': min(self.start_time + 86400, self.end_time) * 1000
            },
            'time': {
                'start': self.start_time * 1000,
                'end': self.end_time * 1000
            },
            'public_read': self.public_read,
            'public_edit': self.public_edit
        }
