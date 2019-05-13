/**
 * @file Routing configuration
 *
 * @author cuiyuan
 */

import home from '../../index/component/index';
import table from '../../index/component/table';

export const routeConfig = [
    {
        name: 'home/:name',
        path: home
    },
    {
        name: 'home',
        path: home
    },
    {
        name: 'table',
        path: table
    }
];