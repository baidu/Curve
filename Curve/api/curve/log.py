# -*- coding: utf-8 -*-
"""
    Log handler
    ~~~~
    log handlers init

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import datetime
import logging
import logging.handlers
import time


class Formatter(logging.Formatter):
    """
    time formatter handle for corner case
    """
    def formatTime(self, record, datefmt=None):
        """
        Return the creation time of the specified LogRecord as formatted text.
        :param record:
        :param datefmt:
        :return:
        """
        if datefmt:
            s = time.strftime(datefmt, self.converter(record.created))
        else:
            s = str(datetime.datetime.now())
        return s


def init_log(app, log_path, level=None, when="D", backup=7,
             log_format="%(levelname)s: %(asctime)s: line:%(lineno)d * %(message)s"):
    """
    logger default config
    :param app:         current flask app.
    :param log_path:    Log file path prefix.
                        Log data will go to two files: log_path.log and log_path.log.wf
                        Any non-exist parent directories will be created automatically
    :param level:       msg above the level will be displayed
                        DEBUG < INFO < WARNING < ERROR < CRITICAL
                        the default value is logging.INFO
    :param when:        how to split the log file by time interval
                        'S' : Seconds
                        'M' : Minutes
                        'H' : Hours
                        'D' : Days
                        'W' : Week day
                        default value: 'D'
    :param backup:      log_format of the log
                        default format:
                        %(levelname)s: %(asctime)s: %(filename)s:%(lineno)d * %(thread)d %(message)s
                        INFO: 12-09 18:02:42: log.py:40 * 139814749787872 HELLO WORLD
    :param log_format:  how many backup file to keep
                        default value: 7
    :raise OSError:     fail to create log directories
    :raise IOError:     fail to open log file
    """
    if log_path.endswith('.log'):
        log_path = log_path[:-4]
    formatter = Formatter(log_format)
    if level is None:
        level = logging.INFO
    app.logger.setLevel(level)
    log_handler = logging.handlers.TimedRotatingFileHandler(log_path + ".log",
                                                            when=when,
                                                            backupCount=backup)
    log_handler.setLevel(level)
    log_handler.setFormatter(formatter)
    app.logger.addHandler(log_handler)
    wf_handler = logging.handlers.TimedRotatingFileHandler(log_path + ".log.wf",
                                                           when=when,
                                                           backupCount=backup)
    wf_handler.setLevel(logging.WARNING)
    wf_handler.setFormatter(formatter)
    app.logger.addHandler(log_handler)
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.ERROR)
    stream_handler.setFormatter(formatter)
    app.logger.addHandler(stream_handler)
