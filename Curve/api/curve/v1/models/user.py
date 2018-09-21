# -*- coding: utf-8 -*-
"""
    Model
    ~~~~
    user model

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from app import db
from .common import (
    auto_init,
    auto_repr,
    default_time
)


class User(db.Model):
    """
    band for reference
    """
    __init__ = auto_init
    __repr__ = auto_repr
    uid = db.Column(db.String, primary_key=True)
    login = db.Column(db.String)
    name = db.Column(db.String)
    create_time = db.Column(db.String)
    update_time = db.Column(db.String)
    auth_time = db.Column(db.Integer, default=default_time, onupdate=default_time)
