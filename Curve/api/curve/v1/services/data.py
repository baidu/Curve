# -*- coding: utf-8 -*-
"""
    Service
    ~~~~
    data operations for abstract

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import urllib
from threading import Lock

import re
from flask import g

from v1 import utils
from exception import DataNotFoundException
from v1.models import DataAbstract, Raw
from v1.models import Point, Thumb, BandItem
from app import db
from v1.models.common import current_user


class DataService(object):
    """
    data operations
    """
    _instance_lock = Lock()
    _instance = {}

    def __new__(cls, *args, **kwargs):
        """
        single pattern
        :param args: args in construct
        :param kwargs: kwargs in construct
        :return:
        """
        data_name = None
        if len(args) > 0:
            data_name = args[0]
        if 'data_name' in kwargs:
            data_name = kwargs['data_name']
        if 'data_id' in kwargs:
            data_id = kwargs['data_id']
            data_abstract = DataAbstract.query.filter_by(id=data_id).first()
            if data_abstract is not None:
                data_name = data_abstract.name
        if data_name is None:
            raise TypeError('__init__ argument data_name not found.')
        if data_name not in DataService._instance:
            with DataService._instance_lock:
                if data_name not in DataService._instance:
                    obj = super(DataService, cls).__new__(cls)
                    DataService.__init__(obj, data_name)
                    DataService._instance[data_name] = obj
        return DataService._instance[data_name]

    def __init__(self, data_name):
        """
        init data service
        :param data_name: the unique name of data
        """
        if re.match(r'[^\w_]', data_name):
            data_name = urllib.quote(data_name)
        self.data_name = data_name
        self.abstract = None

    @staticmethod
    def list(pattern=None):
        """
        list all datas
        :param pattern:
        :return: [DataMeta]
        """
        if pattern:
            return DataAbstract.query.filter(db.text("name like :name")).params(
                name='%%%s%%' % pattern).order_by(DataAbstract.name)
        return DataAbstract.query.order_by(DataAbstract.name)

    def exists(self):
        """
        check data exist or not
        :return:
        """
        try:
            self.get_abstract()
        except DataNotFoundException:
            return False
        return True

    def get_abstract(self):
        """
        get abstract of data, with cache
        :return:
        """
        if self.data_name is None:
            raise DataNotFoundException
        if self.abstract is None:
            self.abstract = DataAbstract.query.filter_by(name=self.data_name, owner=current_user()).first()
        if self.abstract is None:
            raise DataNotFoundException
        return self.abstract

    def get_id(self):
        """
        get id of data
        :return:
        """
        return self.get_abstract().id

    def get_period(self):
        """
        get period of data
        :return:
        """
        return self.get_abstract().period

    def get_raw(self):
        """
        get full raw points of data
        :return:
        """
        return Raw.query.filter_by(data_id=self.get_id())

    def get_line(self, start_time, end_time):
        """
        get a slice of raw points of data
        :param start_time:
        :param end_time:
        :return:
        """
        period = self.get_abstract().period
        start_time = utils.iceil(start_time, period)
        end_time = utils.iceil(end_time, period)
        data_raw = Raw.query.filter(db.and_(
            Raw.data_id.is_(self.get_id()),
            Raw.timestamp.between(start_time, end_time)
        ))
        data_raw = {point.timestamp: point for point in data_raw}
        line = []
        for timestamp in range(start_time, end_time, period):
            if timestamp in data_raw:
                line.append(data_raw[timestamp])
            else:
                line.append(Raw(timestamp=timestamp))
        return line

    def get_thumb(self):
        """
        get thumb of data, with cache inside
        :return:
        """
        return Thumb.query.filter_by(data_id=self.get_id()).one()

    def get_y_axis(self):
        """
        get y_axis of data
        :return:
        """
        return self.get_abstract().y_axis_min, self.get_abstract().y_axis_max

    def get_ref(self, start_time, end_time):
        """
        get reference lines for data
        :param start_time:
        :param end_time:
        :return:
        """
        period = self.get_abstract().period
        start_time = utils.iceil(start_time, period)
        end_time = utils.iceil(end_time, period)
        ref_names = db.session.query(db.distinct(Point.name)).all()
        lines = []
        for ref_name, in ref_names:
            points = Point.query.filter(db.and_(
                Point.data_id.is_(self.get_id()),
                Point.name.is_(ref_name),
                Point.timestamp.between(start_time, end_time)
            ))
            points = {point.timestamp: point for point in points}
            line = []
            for timestamp in range(start_time, end_time, period):
                if timestamp in points:
                    line.append((timestamp, points[timestamp].value, points[timestamp].range))
                else:
                    line.append((timestamp, None, None))
            lines.append((ref_name, line))
        return lines

    def set(self, abstract, data_raws, thumb, refs, bands):
        """
        set data
        :param abstract: abstract meta of data
        :param data_raws: raw points
        :param thumb: pre-calculated thumb
        :param refs: pre-calculated reference lines
        :param bands: pre-calculated band items
        :return:
        """
        if abstract:
            abstract.name = self.data_name
            db.session.add(abstract)
            self.abstract = None
        data_id = self.get_id()
        if data_raws:
            for x in range(len(data_raws)):
                data_raws[x].data_id = data_id
            db.session.bulk_save_objects(data_raws)
        if thumb:
            thumb.data_id = data_id
            db.session.add(thumb)
        if refs:
            ref_points = []
            for name, ref in refs:
                # TODO: sqlite3 with chinese field
                name = urllib.quote(name)
                for point in ref:
                    ref_points.append(Point(
                        timestamp=point[0],
                        value=point[1],
                        range=point[2],
                        data_id=data_id,
                        name=name,
                    ))
            db.session.bulk_save_objects(ref_points)
        if bands:
            band_items = []
            for band_name, items in bands:
                # TODO: sqlite3 with chinese field
                band_name = urllib.quote(band_name)
                for idx, band_item in enumerate(items):
                    band_items.append(BandItem(
                        data_id=data_id,
                        name=band_name,
                        index=idx,
                        reliability=band_item[0],
                        start_time=band_item[1],
                        end_time=band_item[2]
                    ))
            db.session.bulk_save_objects(band_items)
        db.session.commit()

    def set_label(self, start_time, end_time, label):
        """
        label operation
        :param start_time:
        :param end_time:
        :param label: ref E_LABEL
        :return:
        """
        Raw.query.filter(db.and_(
            Raw.data_id.is_(self.get_id()),
            Raw.timestamp.between(start_time, end_time)
        )).update({Raw.label: label}, synchronize_session=False)
        DataAbstract.query.filter_by(id=self.get_id()).update({
            DataAbstract.label_ratio:
                Raw.query.filter_by(
                    data_id=self.get_id(),
                    label=utils.E_LABEL.abnormal
                ).count() * 1. / Raw.query.filter_by(
                    data_id=self.get_id()
                ).count()
        })
        db.session.commit()

    def delete(self):
        """
        delete data
        :return:
        """
        data_id = self.get_id()
        DataAbstract.query.filter_by(id=data_id).delete(synchronize_session=False)
        Raw.query.filter_by(data_id=data_id).delete(synchronize_session=False)
        Point.query.filter_by(data_id=data_id).delete(synchronize_session=False)
        Thumb.query.filter_by(data_id=data_id).delete(synchronize_session=False)
        BandItem.query.filter_by(data_id=data_id).delete(synchronize_session=False)
        db.session.commit()

    def update_privilege(self, public_read, public_edit):
        """
        update privilege
        :param public_read: all user could view and download this data
        :param public_edit: all user could label this data
        :return:
        """
        DataAbstract.query.filter_by(id=self.get_id()).update({
            DataAbstract.public_read: public_read,
            DataAbstract.public_edit: public_edit
        })
        db.session.commit()

    def auth_read(self):
        """
        return if current user can view and download this data
        :return:
        """
        # without auth
        if g.user.uid == 'guest':
            return True
        abstract = self.get_abstract()
        return abstract.public_read or g.user.login == abstract.owner

    def auth_edit(self):
        """
        return if current user can label this data
        :return:
        """
        # without auth
        if g.user.uid == 'guest':
            return True
        abstract = self.get_abstract()
        return abstract.public_edit or g.user.login == abstract.owner

    def auth_manage(self):
        """
        return if current user can edit privilege and delete this data
        :return:
        """
        # without auth
        if g.user.uid == 'guest':
            return True
        return g.user.login == self.get_abstract().owner
