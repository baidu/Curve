/**
 * @file api manage
 * @author mohaiyan
 */


let apis = {};

let DEV = false;
let COMMON_SERVER = '';

let apiConfig = {
    serviceView: COMMON_SERVER + '/serviceView/?r=topology/get',
    columnUrl: COMMON_SERVER + '/serviceView/?r=barGraph/get',
    multiColumnUrl: COMMON_SERVER + '/serviceView/?r=barGraph/multiGet',
    multiServiceViewUrl: COMMON_SERVER + '/serviceView/?r=topology/multiGet',
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
    getDataList: COMMON_SERVER + '/v1/datas'
};

if (DEV) {
    Object.assign(apiConfig, {
        multiServiceViewUrl: 'api/tree',
        multiColumnUrl: 'api/column'
    });
}

export default apis = {
	// API config
    api: apiConfig
};
