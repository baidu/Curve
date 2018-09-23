# -*- coding: utf-8 -*-
"""
    Model
    ~~~~
    data thumb model

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import json

from app import db
from .common import (
    auto_init,
    auto_repr
)


class Thumb(db.Model):
    """
    Thumb
    """
    __init__ = auto_init
    __repr__ = auto_repr
    data_id = db.Column(db.Integer, primary_key=True)
    thumb = db.Column(db.String)

    def view(self):
        """
        render data thumb for view
        :return:
        """
        return self.thumb
