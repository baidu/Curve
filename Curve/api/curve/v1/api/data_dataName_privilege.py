# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import flask

from .resource import Resource
from v1 import utils
from v1.services import DataService


class DataDatanamePrivilege(Resource):

    def put(self, dataName):
        """
        ref: web_api.yaml
        :param dataName:
        :return:
        """
        data_name = utils.encode_if_unicode(dataName)
        data_service = DataService(data_name)
        if not data_service.exists():
            return self.render(msg='%s not found' % data_name, status=404)
        if not data_service.auth_manage():
            return self.render(msg='%s: data access forbidden' % data_name, status=403)
        data_abstract = data_service.get_abstract()
        if 'public_read' in flask.g.args:
            public_read = flask.g.args['public_read']
            if not public_read:
                data_abstract.public_edit = False
            data_abstract.public_read = public_read
        if 'public_edit' in flask.g.args:
            public_edit = flask.g.args['public_edit']
            if public_edit:
                data_abstract.public_read = True
            data_abstract.public_edit = public_edit
        data_service.update_privilege(data_abstract.public_read, data_abstract.public_edit)

        return self.render()
