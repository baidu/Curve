# -*- coding: utf-8 -*-
"""
    Model
    ~~~~
    models in data base

    :copyright: (c) 2017 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from flask_sqlalchemy import SQLAlchemy

from utils import repr_p

db = SQLAlchemy()


class Data(db.Model):
    """
    meta of data
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    start_time = db.Column(db.Integer, nullable=False)
    end_time = db.Column(db.Integer, nullable=False)
    period = db.Column(db.Integer, nullable=False)
    period_ratio = db.Column(db.Float, nullable=False)
    label_ratio = db.Column(db.Float, nullable=False)
    create_time = db.Column(db.Integer, nullable=False)
    update_time = db.Column(db.Integer, nullable=False)

    def __init__(self, name,
                 start_time, end_time,
                 period, period_ratio,
                 label_ratio,
                 create_time, update_time):
        self.name = name
        self.start_time = start_time
        self.end_time = end_time
        self.period = period
        self.period_ratio = period_ratio
        self.label_ratio = label_ratio
        self.create_time = create_time
        self.update_time = update_time

    def __repr__(self):
        return repr_p(self)


class Point(db.Model):
    """
    point
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    data_name = db.Column(db.String(50), nullable=False)  # 外键？
    timestamp = db.Column(db.Integer, nullable=False)
    value = db.Column(db.Float, nullable=True)
    label = db.Column(db.Integer, nullable=False, default=-1)

    def __init__(self, data_name, timestamp, value, label):
        self.data_name = data_name
        self.timestamp = timestamp
        self.value = value
        self.label = label

    def __repr__(self):
        return repr_p(self)


class Thumb(db.Model):
    """
    Thumb
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    data_name = db.Column(db.String(50), nullable=False)  # 外键？
    thumb = db.Column(db.String, nullable=False)

    def __init__(self, data_name, thumb):
        self.data_name = data_name
        self.thumb = thumb

    def __repr__(self):
        return repr_p(self)


class Band(db.Model):
    """
    band for reference
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    data_name = db.Column(db.String, nullable=False)  # 外键？
    name = db.Column(db.String, nullable=False)
    start_time = db.Column(db.Integer, nullable=False)
    end_time = db.Column(db.Integer, nullable=False)
    # TODO: tooltips comment
    # comment = db.Column(db.Text, nullable=False)
    reliability = db.Column(db.Float, nullable=True)

    def __init__(self, data_name, name, start_time, end_time, reliability):
        self.data_name = data_name
        self.name = name
        self.start_time = start_time
        self.end_time = end_time
        self.reliability = reliability

    def __repr__(self):
        return repr_p(self)
