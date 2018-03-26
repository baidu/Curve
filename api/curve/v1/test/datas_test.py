# -*- coding: utf-8 -*-
"""
    Testing
    ~~~~
    data list test

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import uuid

from .base import IcurveTestCase, StringIO


class DatasTestCase(IcurveTestCase):
    """
    data list test
    """

    def test_get_datas(self):
        """
        data list test
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
        message = 'GET /v1/datas normal'
        self.client.post(
            path='/v1/data/%s' % data_name,
            data={'file': (StringIO(test_case), 'test.csv')}
        )
        # test
        response = self.client.get(path='/v1/datas')
        response = self.assertJsonResponse(response, 200)
        try:
            datas = {data['name']: data for data in response}
        except Exception as e:
            raise self.failureException('%s : %s', (e.message, message))
        self.assertIn(data_name, datas)
        data = datas[data_name]
        self.assertEqual(data['name'], data_name)
        self.assertEqual(data['uri'], '/v1/data/%s' % data_name)
        self.assertAlmostEqual(data['labelRatio'], 0.0833, 4)
        self.assertEqual(data['period']['length'], 60)
        self.assertAlmostEqual(data['period']['ratio'], 0.9000, 4)
        self.assertEqual(data['time']['start'], 1503849600000)
        self.assertEqual(data['time']['end'], 1503850320000)
        # teardown
        self.client.delete(path='/v1/data/%s' % data_name)
