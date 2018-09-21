/* eslint-disable */
/**
 * @file mockup reset
 * @author mohaiyan
 */

const express = require('express');
const app = express();
const apiRouters = express.Router();

const paths = require('./paths');
const appMockup = paths.appMockup;

apiRouters.all('/column', function (req, res) {
	const filepath = require.resolve(appMockup + '/column.json');
	delete require.cache[filepath];
    res.json(require(filepath));

});


module.exports = apiRouters;
/* eslint-disable */