# -*- coding: utf-8 -*-
"""
    Curve
    ~~~~
    test entity for dev, pytest is recommend

    :copyright: (c) 2017-2018 by Baidu, Inc.
    :license: Apache, see LICENSE for more details.
"""
import re
import sys

from pytest import main

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw?|\.exe)?$', '', sys.argv[0])
    sys.exit(main())
