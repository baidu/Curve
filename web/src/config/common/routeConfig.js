/**
 * @file Routing configuration
 *
 * @author mohaiyan
 */

import home from '../../index/component/index';
import list from '../../index/component/list';

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
        name: 'list',
        path: list
    }
];