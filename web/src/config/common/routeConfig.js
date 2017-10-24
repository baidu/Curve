/**
 * @file Routing configuration
 *
 * @author mohaiyan
 */

import home from '../../index/component/index';

export const routeConfig = [
    {
        name: 'home/:name',
        path: home
    },
    {
        name: 'home',
        path: home
    }
];