# -*- coding: utf-8 -*-
"""
    Model utils
    ~~~~
    common functions for database model

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import time

import flask


def current_user():
    """
    get current user name from session
    :return:
    """
    return flask.g.user.login


def default_time():
    """
    get current timestamp
    :return:
    """
    return int(time.time())


def auto_init(obj, *args, **kwargs):
    """
    init function for models
    set all the public attr from args
    :param obj: self
    :param args:
    :param kwargs:
    :return:
    """
    attrs = [key for key in obj.__class__.__dict__.keys() if not key.startswith('_')]
    for index, value in enumerate(args[:len(attrs)]):
        setattr(obj, attrs[index], value)
    for attr in attrs:
        if attr in kwargs:
            setattr(obj, attr, kwargs[attr])


REPR_FILTER = {'_sa_instance_state'}


def auto_repr(obj):
    """
    object printable translate
    :param obj:
    :return:
    """
    return '<%s %s>' % (
        obj.__class__.__name__,
        ' '.join([
            '%s:%s' % item
            for item in obj.__dict__.items()
            if item[0] not in REPR_FILTER
        ])
    )
