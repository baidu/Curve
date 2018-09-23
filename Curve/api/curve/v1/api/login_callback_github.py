# -*- coding: utf-8 -*-
"""
    Web API
    ~~~~
    ref: web_api.yaml

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import hashlib

from flask import (
    current_app,
    session
)

import config
from .resource import Resource
from app import db
from v1.models import User


class LoginCallbackGithub(Resource):
    """
    ref: web_api.yaml
    """
    def get(self):
        """
        ref: web_api.yaml
        """
        def authorize(access_token):
            next_url = config.STATIC_SERVER
            if access_token is None:
                return Resource.redirect(next_url)
            salt = current_app.github.client_secret
            uid = hashlib.sha512(salt + access_token).hexdigest()
            user = User.query.filter_by(uid=uid).first()
            if user is None:
                user = current_app.github.get('user', access_token=access_token)
                db.session.add(User(
                    uid=uid,
                    login=user['login'],
                    name=user['name'],
                    create_time=user['created_at'],
                    update_time=user['updated_at'],
                ))
                db.session.commit()
            session['uid'] = uid
            return Resource.redirect(next_url)

        return current_app.github.authorized_handler(authorize)()
