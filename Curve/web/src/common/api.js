/**
 * @file api manage
 * @author mohaiyan
 */


let apis = {};

let DEV = false;
let COMMON_SERVER = '';
// COMMON_SERVER = 'http://localhost:8080';

let apiConfig = {
    // Get the operation menu
    getTooltipMenu: COMMON_SERVER + '/v1/menus',
    // Menu data operation
    menuOpera: COMMON_SERVER + '/v1/data/',
    // Get the trend graph
    getTrend: COMMON_SERVER + '/v1/data/',
    // Get the thumbnail trend graph
    getThumbTrend: COMMON_SERVER + '/v1/data/',
    // Mark data and unmark data
    labelTrend: COMMON_SERVER + '/v1/data/',
    // upload data
    uploadData: COMMON_SERVER + '/v1/data/',
    // Get the data list
    getDataList: COMMON_SERVER + '/v1/datas',
    // delete data
    deleteData: COMMON_SERVER + '/v1/data/',
    // export data
    exportData: COMMON_SERVER + '/v1/data/',
    // auth data
    permissions: COMMON_SERVER + '/v1/data/'
};

if (DEV) {
    Object.assign(apiConfig, {});
}

export default apis = {
    // API config
    api: apiConfig
};
