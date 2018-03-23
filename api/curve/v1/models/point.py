# -*- coding: utf-8 -*-
"""
    Model
    ~~~~
    point model

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from app import db
from .common import (
    auto_init,
    auto_repr
)


class Point(db.Model):
    """
    point of data
    """
    __init__ = auto_init
    __repr__ = auto_repr
    data_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, primary_key=True)
    timestamp = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.Float, nullable=True)
    range = db.Column(db.Float, nullable=True)
