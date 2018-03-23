# -*- coding: utf-8 -*-
"""
    Exception
    ~~~~
    def of web exceptions and exception handles

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""


class DataNotFoundException(BaseException):
    """
    data not found
    """
    pass


class UnprocessableException(BaseException):
    """
    request param is unprocessable
    """
    pass


# TODO: errorhandler
def init_error_handlers(app):
    """
    add error handlers for exceptions above
    """
    pass
