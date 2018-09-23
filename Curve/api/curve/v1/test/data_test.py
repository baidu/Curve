# -*- coding: utf-8 -*-
"""
    Testing
    ~~~~
    data operation test

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import uuid

from .base import IcurveTestCase, StringIO


class DataTestCase(IcurveTestCase):
    """
    data operation test
    """

    data_names = []

    # TODO:
    # 1. special data_name
    # 2. invalid file
    # 3. csv with header
    # 4. invalid timestamp, value, label
    def test_post_data(self):
        """
        data upload test
        """
        # prepare
        data_name = str(uuid.uuid4()).replace('-', '')
        test_case = '20170828000000,52794.0,0\r\n' \
                    '20170828000100,52558.0,0\r\n' \
                    '20170828000200,51845.0,0\r\n' \
                    '20170828000300,51096.0,0\r\n' \
                    '20170828000400,51300.0,0\r\n' \
                    '20170828000500,50922.0,0\r\n' \
                    '20170828000600,50516.0,0\r\n' \
                    '20170828000700,50289.0,0\r\n' \
                    '20170828000800,49476.0,0\r\n' \
                    '20170828001000,49284.0,0\r\n' \
                    '20170828001100,49476.0,1\r\n'
        message = 'POST /v1/data/<dataName> normal'
        # test
        response = self.client.post(
            path='/v1/data/%s' % data_name,
            data={'file': (StringIO(test_case), 'test.csv')}
        )
        self.assertJsonResponse(
            response,
            201,
            {'Location': 'http://localhost/v1/data/%s' % data_name},
            None,
            message
        )
        # teardown
        self.client.delete(path='/v1/data/%s' % data_name)

    # TODO:
    # 1. special data_name
    def test_get_data(self):
        """
        test download data
        """
        # prepare
        data_name = str(uuid.uuid4()).replace('-', '')
        test_case = '20170828000000,52794.0,0\r\n' \
                    '20170828000100,52558.0,0\r\n' \
                    '20170828000200,51845.0,0\r\n' \
                    '20170828000300,51096.0,0\r\n' \
                    '20170828000400,51300.0,0\r\n' \
                    '20170828000500,50922.0,0\r\n' \
                    '20170828000600,50516.0,0\r\n' \
                    '20170828000700,50289.0,0\r\n' \
                    '20170828000800,49476.0,0\r\n' \
                    '20170828001000,49284.0,0\r\n' \
                    '20170828001100,49476.0,1\r\n'
        test_resp = 'timestamp,value,label\r\n' \
                    '20170828000000,52794.0,0\r\n' \
                    '20170828000100,52558.0,0\r\n' \
                    '20170828000200,51845.0,0\r\n' \
                    '20170828000300,51096.0,0\r\n' \
                    '20170828000400,51300.0,0\r\n' \
                    '20170828000500,50922.0,0\r\n' \
                    '20170828000600,50516.0,0\r\n' \
                    '20170828000700,50289.0,0\r\n' \
                    '20170828000800,49476.0,0\r\n' \
                    '20170828000900,,\r\n' \
                    '20170828001000,49284.0,0\r\n' \
                    '20170828001100,49476.0,1\r\n'
        test_header = {
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename=%s.csv' % data_name
        }
        message = 'GET /v1/data/<dataName> normal'
        self.client.post(
            path='/v1/data/%s' % data_name,
            data={'file': (StringIO(test_case), 'test.csv')}
        )
        # test
        response = self.client.get(path='/v1/data/%s' % data_name)
        self.assertEqual(response.status_code, 200)
        resp_headers = {key: value for key, value in response.headers}
        for key, value in test_header.items():
            self.assertIn(key, resp_headers, message)
            self.assertEqual(value, resp_headers[key], message)
        self.assertEqual(response.data, test_resp)
        # teardown
        self.client.delete(path='/v1/data/%s' % data_name)

    # TODO: check deleted
    def test_delete_data(self):
        """
        data delete test
        """
        # prepare
        data_name = str(uuid.uuid4()).replace('-', '')
        test_case = '20170828000000,52794.0,0\r\n' \
                    '20170828000100,52558.0,0\r\n' \
                    '20170828000200,51845.0,0\r\n' \
                    '20170828000300,51096.0,0\r\n' \
                    '20170828000400,51300.0,0\r\n' \
                    '20170828000500,50922.0,0\r\n' \
                    '20170828000600,50516.0,0\r\n' \
                    '20170828000700,50289.0,0\r\n' \
                    '20170828000800,49476.0,0\r\n' \
                    '20170828001000,49284.0,0\r\n' \
                    '20170828001100,49476.0,1\r\n'
        message = 'GET /v1/data/<dataName> normal'
        self.client.post(
            path='/v1/data/%s' % data_name,
            data={'file': (StringIO(test_case), 'test.csv')}
        )
        # test
        response = self.client.delete(path='/v1/data/%s' % data_name)
        self.assertJsonResponse(response, 200, message='OK')
