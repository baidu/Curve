/**
 * @file response
 * @author cuiyuan
 */

import './trend.less';

import React, {Component} from 'react';
import {Icon} from 'antd';
import {axiosInstance} from '../../tools/axiosInstance';
import eventProxy from '../../tools/eventProxy';
import Chart from '../../common/baseComponent/chart';
import UploadData from '../../common/baseComponent/uploadData';
import img from '../../common/image/background-image.png';
import moment from 'moment';
import $ from 'jquery';
import Band from '../../common/baseComponent/band';

const api = require('../../common/api').default.api;

window.selectedIndex = {};
window.labelObj = {};
window.thumbExtremes = {};

let key = {
    keyMap: {a: 65, d: 68, s: 83, w: 87, z: 90, spacebar: 32},
    currentKey: null,
    mouseKey: null
};

export default class Trend extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // Trend graph name
            title: '',
            // Related overview information
            summary: {},
            // Trend graph data
            data: [],
            // name of trend
            name: '',
            // Get the url of the trend graph
            url: api.getTrend,
            // menu of operation
            menuList: [],
            // The list of data on the left
            dataList: [],
            // Get the url of the thumbnail trend graph
            thumbUrl: api.getThumbTrend,
            chart: {},
            startTime: 0,
            endTime: 0,
            // All the points of the trend graph
            allSeriesPoints: [],
            list: [],
            init: true,
            container: 'container',
            options: {},
            type: 'stockChart',
            max: 0,
            min: 0,
            legend: {},
            bandMenuStyle: true,
            smallBandMenuStyle: false,
            // if trend is loading
            loading: true,
            neverReflow: false
        };
        this.abnormalSelectedPoints = [];
        this.abnormalSelectedIndex = [];
    }

    componentDidMount() {
        const self = this;
        self.renderTrend();
        self.getOperaMenuData();
        let name = self.props.params.name;
        let num = 1;
        $('body').on('keydown', function (e) {
            e.preventDefault();
            e = e ? e : window.event;
            key.currentKey = e.keyCode || e.which || e.charCode;
        });
        // Keyboard operation trend graph
        $('body').on('keyup', function (e) {
            e.preventDefault();
            e = e ? e : window.event;
            let t = e.keyCode || e.which || e.charCode;
            if (t === 32) {
                key.currentKey = null;
            }
            // 38, 87: enlarge
            // 40, 83: Shrink down
            // 37: Left shift
            // 39: Right shift
            let chart = self.chart;
            let axis = chart && chart.xAxis[0].getExtremes();
            let min = axis && Math.round(axis.min);
            let max = axis && Math.round(axis.max);
            let step = 0;
            let startTime;
            let endTime;
            let name = self.props.params.name;
            if (min <= max) {
                step = parseInt((max - min) * 0.25, 10);
            }
            let extremesMax = window.thumbExtremes[name].max;
            let extremesMin = window.thumbExtremes[name].min;
            // If there is no data and the minimum value is greater than or equal to the maximum value, the keyboard operation is no longer performed
            if (t === 38 || t === 87) {
                if (min + step < max - step) {
                    chart.xAxis[0].setExtremes(min + step, max - step, false);
                    startTime = min + step;
                    endTime = max - step;
                }
                else if (min + step === max - step) {
                    chart.xAxis[0].setExtremes(min + step, max - step, false);
                    self.enlargeExtremesMax = max - step;
                    self.enlargeExtremesMin = min + step;
                    startTime = min + step;
                    endTime = max - step;
                }
                else {
                    chart.xAxis[0].setExtremes(self.enlargeExtremesMin, self.enlargeExtremesMax, false);
                    startTime = self.enlargeExtremesMin;
                    endTime = self.enlargeExtremesMax;
                }
            }
            else if (t === 40 || t === 83) {
                if (min - step >= extremesMin && max + step <= extremesMax) {
                    chart.xAxis[0].setExtremes(min - step, max + step, false);
                    startTime = min - step;
                    endTime = max + step;
                }
                else if (min - step >= extremesMin && max + step >= extremesMax) {
                    chart.xAxis[0].setExtremes(min - step, extremesMax, false);
                    startTime = min - step;
                    endTime = extremesMax;
                }
                else if (min - step <= extremesMin && max + step <= extremesMax) {
                    chart.xAxis[0].setExtremes(extremesMin, extremesMax, false);
                    startTime = extremesMin;
                    endTime = max + step;
                }
                else if (min - step <= extremesMin && max + step >= extremesMax) {
                    chart.xAxis[0].setExtremes(extremesMin, extremesMax, false);
                    startTime = extremesMin;
                    endTime = extremesMax;
                }
            }
            else if (t === 37 || t === 65) {
                if (min - step >= extremesMin) {
                    chart.xAxis[0].setExtremes(min - step, max - step, false);
                    startTime = min - step;
                    endTime = max - step;
                }
                else {
                    self.extremesMax = self.extremesMax ? self.extremesMax : min + step;
                    chart.xAxis[0].setExtremes(extremesMin, self.extremesMax, false);
                    startTime = extremesMin;
                    endTime = self.extremesMax;
                }
            }
            else if (t === 39 || t === 68) {
                if (max + step <= extremesMax) {
                    chart.xAxis[0].setExtremes(min + step, max + step, false);
                    startTime = min + step;
                    endTime = max + step;
                }
                else {
                    self.extremesMin = self.extremesMin ? self.extremesMin : min + step;
                    chart.xAxis[0].setExtremes(self.extremesMin, extremesMax, false);
                    startTime = self.extremesMin;
                    endTime = extremesMax;
                }
            }
            if (startTime && endTime) {
                let url = api.getTrend
                    + name
                    + '/curves?'
                    + 'startTime=' + startTime
                    + '&endTime=' + endTime;
                self.getTrendData(url, undefined, undefined, false);
            }
            // Scroll around one screen
            // 65: prev screen
            // 68: next: next screen
        });
        // Operation menu
        $('body').delegate('.selection li', 'click', function (e) {
            e.stopPropagation();
            let action = $(this).attr('data-action');
            let startTime = 0;
            let endTime = 0;
            let chart = window.chartTrend;
            let currentX = window.currentX;
            let series;
            let startIndex;
            let endIndex;
            let name = self.props.params.name;
            chart.series.map((item, index) => {
                if (item.name === 'label line') {
                    series = item;
                    return;
                }
            });
            let points = series.points;
            let currentIndex = 0;
            // get real startTime and endTime
            for (let i = 0; i < window.labelObj[name].length; i++) {
                if (currentX >= window.labelObj[name][i][0] && currentX <= window.labelObj[name][i][1]) {
                    startTime = window.labelObj[name][i][0];
                    endTime = window.labelObj[name][i][1];
                    currentIndex = i;
                    break;
                }
            }
            // get real index of startTime and endTime
            for (let i = 0; i < points.length; i++) {
                if (points[i].x === startTime) {
                    startIndex = i;
                }
                if (points[i].x === endTime) {
                    endIndex = i;
                }
            }

            let url = api.menuOpera
                + name
                + '?startTime=' + startTime
                + '&endTime=' + endTime
                + '&action=' + action;
            // get current trend graph max and min
            let min = Math.round(chart.xAxis[0].min);
            let max = Math.round(chart.xAxis[0].max);

            axiosInstance.put(url).then(function (response) {
                // update selectedIndex
                if (!window.selectedIndex[name]) {
                    window.selectedIndex[name] = [];
                }
                let cancelIndex = [];
                for (let i = startIndex; i <= endIndex; i++) {
                    cancelIndex.push(i);
                }
                let finalResult = [];
                for (let j = 0; j < window.selectedIndex[name].length; j++) {
                    if (cancelIndex.indexOf(window.selectedIndex[name][j]) === -1) {
                        finalResult.push(window.selectedIndex[name][j]);
                    }
                }
                window.selectedIndex[name] = finalResult;
                // update window.labelObj
                window.labelObj[name].splice(currentIndex, 1);
                // redraw trend
                self.redrawTrend(min, max);
            });
        });
        // Operation tooltip
        $('body').delegate('.area-tooltip .load-trend', 'click', function (e) {
            e.stopPropagation();
            let type = $(this).attr('data-action');
            let startTime = 0;
            let endTime = 0;
            let bandName = $(this).attr('data-band-name');
            if (type === 'left') {
                startTime = $(this).attr('data-pre-start-time');
                endTime = $(this).attr('data-pre-end-time');
            }
            else {
                startTime = $(this).attr('data-next-start-time');
                endTime = $(this).attr('data-next-end-time');
            }
            let name = self.props.params.name;
            let url = api.getTrend
                + name
                + '/curves?'
                + 'startTime=' + startTime
                + '&endTime=' + endTime
                + '&bandName=' + bandName;
            self.getTrendData(url, undefined, undefined, false);
        });

        // loading trend graph
        if (self.props.params.list && self.props.params.list.length) {
            self.loadingTime = setInterval(function () {
                let text = '';
                if (num === 1) {
                    text = 'The trend is loading, please wait' + '.';
                }
                else if (num === 2) {
                    text = 'The trend is loading, please wait' + '..';
                }
                else if (num === 3) {
                    text = 'The trend is loading, please wait' + '...';
                    num = 0;
                }
                num++;
                if (self.props.params.list && self.props.params.list.length && self.state.loading) {
                    if (self.refs.loadingContainer) {
                        self.refs.loadingContainer.innerHTML = text;
                    }
                }
            }, 800);
        }

        // Operation  menu
        $('body').delegate('.label-opera', 'click', function (e) {
            let startTime = $(this).attr('data-current-start-time');
            let endTime = $(this).attr('data-current-end-time');
            self.label(startTime, endTime);
        });

        // Gets the subscript of the selected point
        // Get the selected interval
        eventProxy.on('loadedChart', chart => {
            let series;
            let name = self.props.params.name;
            window.labelObj[name] = [];
            chart.series.map((item, index) => {
                if (item.name === 'label line') {
                    series = item;
                }
            });
            let selectedIndex = [];
            if (!series) {
                return;
            }
            series.points.map((item, index) => {
                if (item.y) {
                    selectedIndex.push(index);
                }
            });
            let num = 0;
            let tempEndTime;
            let tempStartTime;
            for (let i = 0; i < selectedIndex.length; i++) {
                if (selectedIndex[i] + 1 === selectedIndex[i + 1]) {
                    num++;
                }
                else {
                    tempEndTime = series.points[selectedIndex[i]].x;
                    tempStartTime = series.points[selectedIndex[i - num]].x;
                    num = 0;
                    window.labelObj[name].push([tempStartTime, tempEndTime]);
                }
            }

            if (!window.selectedIndex[name]) {
                window.selectedIndex[name] = [];
            }
            window.selectedIndex[name] = selectedIndex;

            if (selectedIndex.length < window.selectedIndex[name].length) {
                for (let m = 0; m < selectedIndex.length; m++) {
                    if (window.selectedIndex[name].indexOf(selectedIndex[m]) === -1) {
                        window.selectedIndex[name].push(selectedIndex[m]);
                    }
                }
            }
            else {
                for (let n = 0; n < window.selectedIndex[name].length; n++) {
                    if (selectedIndex.indexOf(window.selectedIndex[name][n]) === -1) {
                        selectedIndex.push(window.selectedIndex[name][n]);
                    }
                }
                window.selectedIndex[name] = selectedIndex;
            }
        });
    }

    // redraw trend
    redrawTrend(min, max) {
        const self = this;
        let start = min;
        let end = max;
        let name = self.props.params.name;
        let url = api.getTrend
            + name
            + '/curves?'
            + 'startTime=' + start
            + '&endTime=' + end;
        self.getTrendData(url, undefined, undefined, false);
    }

    shouldComponentUpdate(nextProps) {
        if (this.props.params === nextProps.params) {
            return true;
        }
        this.renderTrend(nextProps);
        return false;
    }

    componentWillUnmount() {
        $('body').off('keydown');
        $('body').off('keyup');
        $('body').undelegate('.selection li', 'click');
        $('body').undelegate('.area-tooltip .load-trend', 'click');
    }

    // After the drag operation, the subscript of the selected data point is obtained
    getSelectedIndex(e, series) {
        let selectedIndex = [];
        series.data.map((item, index) => {
            if (item[0] >= e.xAxis[0].min && item[0] <= e.xAxis[0].max) {
                selectedIndex.push(index);
            }
        });
        return selectedIndex;
    }

    // Get the index of the base line
    getOriginLineIndex(me) {
        let originIndex = 0;
        for (let i = 0; i < me.series.length; i++) {
            if (me.series[i].name === 'base line') {
                originIndex = i;
                break;
            }
        }
        return originIndex;
    }

    // Gets the subscript of the selected data point
    dealSelectedIndex(me, originIndex, selectedIndex) {
        let length = selectedIndex.length;
        if (length) {
            if (length === 2) {
                if (selectedIndex[0] === 0) {
                    selectedIndex.push(1);
                }
                else if (selectedIndex[length - 1] === me.series[originIndex].points.length - 1) {
                    selectedIndex.unshift(selectedIndex[length - 1] - 2);
                }
                else {
                    selectedIndex.push(selectedIndex[length - 1] + 1);
                    selectedIndex.splice(0, 1);
                }
            }
            else {
                if (selectedIndex[0] === 0) {
                    selectedIndex.push(selectedIndex[length - 1] + 1);
                }
                else if (selectedIndex[length - 1] === me.series[originIndex].points.length - 1) {

                }
                else {
                    selectedIndex.push(selectedIndex[length - 1] + 1);
                    selectedIndex.splice(0, 1);
                }
            }
        }
        return selectedIndex;
    }

    // label data
    label(start, end) {
        const self = this;
        const me = self.chart;
        let originIndex1 = 0;
        let name = self.props.params.name;
        for (let i = 0; i < me.series.length; i++) {
            if (me.series[i].name === 'base line') {
                originIndex1 = i;
                break;
            }
        }
        let selectedIndex = [];
        let points = me.series[originIndex1].points;
        points.map((item, index) => {
            if (item.x >= Math.round(start) && item.x <= Math.round(end)) {
                selectedIndex.push(index);
            }
        });

        selectedIndex = self.dealSelectedIndex(me, originIndex1, selectedIndex);

        let startTime = points[selectedIndex[0]].x;
        let endTime = points[selectedIndex[selectedIndex.length - 1]].x;

        if (!window.labelObj[name]) {
            window.labelObj[name] = [];
        }
        window.labelObj[name].push([startTime, endTime]);

        let finalAbnormalSelectedIndex = selectedIndex;
        for (let n = 0; n < self.abnormalSelectedIndex.length; n++) {
            if (selectedIndex.indexOf(self.abnormalSelectedIndex[n]) === -1) {
                finalAbnormalSelectedIndex.push(self.abnormalSelectedIndex[n]);
            }
        }

        self.abnormalSelectedIndex = finalAbnormalSelectedIndex;

        self.abnormalSelectedIndex.sort(function (a, b) {
            return a - b;
        });

        if (!window.selectedIndex[name]) {
            window.selectedIndex[name] = [];
        }
        // To merge the subscripts of selected data points
        let finalSelectedIndex = [];
        finalSelectedIndex = self.abnormalSelectedIndex;
        for (let m = 0; m < window.selectedIndex[name].length; m++) {
            if (self.abnormalSelectedIndex.indexOf(window.selectedIndex[name][m]) === -1) {
                finalSelectedIndex.push(window.selectedIndex[name][m]);
            }
        }

        window.selectedIndex[name] = finalSelectedIndex;

        window.selectedIndex[name].sort(function (a, b) {
            return a - b;
        });

        let result = [];
        let removeIndex = 0;
        for (let i = 0; i < me.series.length; i++) {
            if (me.series[i].color === 'red') {
                removeIndex = i;
                break;
            }
        }

        for (let i = 0; i < me.series[originIndex1].points.length; i++) {
            if (window.selectedIndex[name].indexOf(i) !== -1) {
                result.push([me.series[originIndex1].points[i].x, me.series[originIndex1].points[i].y]);
            }
            else {
                result.push([me.series[originIndex1].points[i].x, null]);
            }
        }

        me.series[removeIndex].remove();

        let label = 1;
        window.startTime = startTime;
        window.endTime = endTime;
        let url = api.labelTrend
            + name + '/label'
            + '?startTime=' + startTime
            + '&endTime=' + endTime
            + '&label=' + label;
        axiosInstance.put(url).then(function (response) {
            // add label line
            me.addSeries({
                name: 'label line',
                data: result,
                type: 'line',
                lineWidth: 2,
                color: 'red',
                zIndex: 101,
                showInLegend: false,
                enableMouseTracking: true,
                marker: {
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                }
            }, false);
            me.redraw();
            self.abnormalSelectedIndex = [];
        });
    }

    // cancel data
    cancelLabel(start, end) {
        const self = this;
        const me = self.chart;
        let name = self.props.params.name;
        let unselectedIndex = [];
        let originIndex = 0;

        for (let i = 0; i < me.series.length; i++) {
            if (me.series[i].name === 'base line') {
                originIndex = i;
                break;
            }
        }

        let points = me.series[originIndex].points;
        points.map((item, index) => {
            if (item.x >= Math.round(start) && item.x <= Math.round(end)) {
                unselectedIndex.push(index);
            }
        });
        unselectedIndex = self.dealSelectedIndex(me, originIndex, unselectedIndex);

        let startTime = points[unselectedIndex[0]].x;
        let endTime = points[unselectedIndex[unselectedIndex.length - 1]].x;

        if (!window.labelObj[name]) {
            window.labelObj[name] = [];
        }
        let min = startTime;
        let max = endTime;
        let tempStart;
        let tempEnd;
        for (let i = 0; i < window.labelObj[name].length; i++) {
            tempStart = window.labelObj[name][i][0];
            tempEnd = window.labelObj[name][i][1];
            if (min < tempStart && max > tempEnd) {
                window.labelObj[name].splice(i, 1);
            }
            else if (min < tempStart && max > tempStart && max > tempEnd) {
                window.labelObj[name].splice(i, 1);
                window.labelObj[name].push([max, tempEnd]);
            }
            else if (min < tempEnd && min > tempStart && max > tempEnd) {
                window.labelObj[name].splice(i, 1);
                window.labelObj[name].push([tempStart, min]);
            }
            else if (min > tempStart &&  max < tempEnd) {
                window.labelObj[name].splice(i, 1);
                window.labelObj[name].push([tempStart, min]);
                window.labelObj[name].push([max, tempEnd]);
            }
            else if (min < tempStart && max === tempStart) {

            }
            else if (min === tempEnd && max > tempEnd) {

            }
            else if (min < tempStart && max === tempEnd) {
                window.labelObj[name].splice(i, 1);
            }
            else if (min === tempStart && max > tempEnd) {
                window.labelObj[name].splice(i, 1);
            }
            else if (min === tempStart && max === tempEnd) {
                window.labelObj[name].splice(i, 1);
            }
        }

        if (!window.selectedIndex[name]) {
            window.selectedIndex[name] = [];
        }

        for (let i = 0; i < window.selectedIndex[name].length; i++) {
            if (unselectedIndex.indexOf(window.selectedIndex[name][i]) !== -1) {
                window.selectedIndex[name][i] = undefined;
            }
        }

        let resultIndex = [];
        for (let i = 0; i < window.selectedIndex[name].length; i++) {
            if (window.selectedIndex[name][i] !== undefined) {
                resultIndex.push(window.selectedIndex[name][i]);
            }
        }

        resultIndex.sort(function (a, b) {
            return a - b;
        });

        window.selectedIndex[name] = resultIndex;

        window.selectedIndex[name].sort(function (a, b) {
            return a - b;
        });

        let result = [];
        for (let i = 0; i < me.series[originIndex].points.length; i++) {
            if (resultIndex.indexOf(i) !== -1) {
                result.push([me.series[originIndex].points[i].x, me.series[originIndex].points[i].y]);
            }
            else {
                result.push([me.series[originIndex].points[i].x, null]);
            }
        }
        let removeIndex = 0;
        for (let i = 0; i < me.series.length; i++) {
            if (me.series[i].color === 'red') {
                removeIndex = i;
                break;
            }
        }
        me.series[removeIndex].remove();

        let label = 0;
        window.startTime = startTime;
        window.endTime = endTime;
        let url = api.labelTrend
            + name + '/label'
            + '?startTime=' + startTime
            + '&endTime=' + endTime
            + '&label=' + label;
        axiosInstance.put(url).then(function (response) {
            me.addSeries({
                name: 'label line',
                data: result,
                type: 'line',
                lineWidth: 2,
                color: 'red',
                zIndex: 101,
                showInLegend: false,
                marker: {
                    enabled: false
                }
            }, false);
            me.redraw();
        });

        key.currentKey = null;
    }

    // Get the configuration of the trend graph
    getConfig(props) {
        const self = this;
        let bandName;
        let config = Object.assign({}, self.props.params);
        if (props) {
            config = Object.assign(config, props.params);
        }
        let name = config.name;
        let start;
        let end;
        let list;
        if (props && props.params) {
            list = props.params.list;
        }
        if (!list || !list.length) {
            return;
        }
        list.map((item, index) => {
            if (item.name === name) {
                start = item.time.start;
                end = item.time.end;
                return;
            }
        });
        if (start === undefined || end === undefined) {
            return;
        }
        let url = api.getTrend
            + name
            + '/curves?'
            + 'startTime=' + start
            + '&endTime=' + end;
        if (bandName) {
            url += '&bandName=' + bandName;
        }
        let menuList = self.state.menuList;
        let container = 'container';
        let title = self.state.title;
        let thumb = [];
        let thumbUrl = self.state.thumbUrl + name + '/thumb';
        let menuDisplay = self.props.menuDisplay;
        let max = self.state.max;
        let min = self.state.min;
        // The trend graph is loaded after the completion of the operation
        let loadFunction = function () {
            let chart = this;
            if (chart.series.length) {
                chart.series.map((item, i) => {
                    if (item.name === 'base line') {
                        self.allSeriesPoints = chart.series[i].points;
                        self.abnormalSelectedPoints = [];
                        self.min = chart.xAxis[0].min;
                        self.max = chart.xAxis[0].max;
                    }
                });
            }
        };
        // Drag and drop to select the trend data point operation
        let selectionFunction = function (e) {
            e.preventDefault();
            let me = this;
            if (key.currentKey === 32) {
                cancelLabel(me, e);
            }
            else {
                label(me, e);
            }
            return false;
        };
        // cancel label operation
        let cancelLabel = function (me, e) {
            self.cancelLabel(e.xAxis[0].min, e.xAxis[0].max);
        };
        // label operation
        let label = function (me, e) {
            self.label(e.xAxis[0].min, e.xAxis[0].max);
        };
        // Drag the small slider of the scrollbar to operate
        let afterSetExtremesFunction =  function (e) {
            e.preventDefault();
            self.afterSetExtremes.call(self, e);
        };
        // tooltipFormatter
        // In two ways:
        // First: band, ie area, display tooltip;
        // Second: label line, display operation menu; base line does not display the operation menu;
        let tooltipFormatterFunction = function (e) {
            const me = this;
            if (this.series.userOptions.type === 'area') {
                let tooltip = '';
                let current;
                let total;
                let bandName = this.series.name;
                let band;
                let pre;
                let next;
                let currentTime;
                for (let i = 0; i < self.state.bands.length; i++) {
                    band = self.state.bands[i];
                    if (band.name === bandName) {
                        for (let j = 0; j < band.bands.length; j++) {
                            if (band.bands[j].currentTime.duration.start === me.x
                                || band.bands[j].currentTime.duration.end === me.x) {
                                current = band.bands[j].bandNo;
                                total = band.bands[j].bandCount;
                                pre = band.bands[j].preTime;
                                next = band.bands[j].nextTime;
                                currentTime = band.bands[j].currentTime;
                                if (current === total && current === 1) {
                                    tooltip += '<div class="area-tooltip">'
                                        + '<div class="area-tooltip-content">'
                                        + '<p class="label-opera label" '
                                        + 'style="cursor: pointer; color: #388ff7;" '
                                        + 'data-current-start-time="'
                                        + currentTime.duration.start + '" '
                                        + 'data-current-end-time="'
                                        + currentTime.duration.end
                                        + '">Label</p>'
                                        + '<div class="num-tooltip">'
                                        + '<span class="current-tooltip">'
                                        + current
                                        + '</span>'
                                        + '/'
                                        + '<span class="total-tooltip">'
                                        + total
                                        + '</span>'
                                        + '</div>'
                                        + '</div>'
                                        + '</div>';
                                }
                                else if (current < total && current === 1) {
                                    tooltip += '<div class="area-tooltip">'
                                        + '<div class="area-tooltip-content">'
                                        + '<p class="label-opera label" '
                                        + 'style="cursor: pointer; color: #388ff7;" '
                                        + 'data-current-start-time="'
                                        + currentTime.duration.start
                                        + '" data-current-end-time="'
                                        + currentTime.duration.end
                                        + '">Label</p>'
                                        + '<div class="num-tooltip">'
                                        + '<span class="current-tooltip">'
                                        + current
                                        + '</span>'
                                        + '/'
                                        + '<span class="total-tooltip">'
                                        + total
                                        + '</span>'
                                        + '<i class="anticon anticon-caret-right load-trend" '
                                        + 'style="cursor: pointer; color: #388ff7" '
                                        + 'data-action="right" data-next-start-time="'
                                        + next.start
                                        + '" data-next-end-time="'
                                        + next.end
                                        + '" data-band-name="'
                                        + bandName
                                        + '"></i>'
                                        + '</div>'
                                        + '</div>'
                                        + '</div>';
                                }
                                else if (current === total && current !== 1) {
                                    tooltip += '<div class="area-tooltip">'
                                        + '<div class="area-tooltip-content">'
                                        + '<p class="label-opera label" '
                                        + 'style="cursor: pointer; color: #388ff7;" '
                                        + 'data-current-start-time="'
                                        + currentTime.duration.start
                                        + '" data-current-end-time="'
                                        + currentTime.duration.end
                                        + '">Label</p>'
                                        + '<div class="num-tooltip">'
                                        + '<i class="anticon anticon-caret-left load-trend" '
                                        + 'style="cursor: pointer; color: #388ff7" '
                                        + 'data-action="left" data-pre-start-time="'
                                        + pre.start
                                        + '" data-pre-end-time="'
                                        + pre.end
                                        + '" data-band-name="'
                                        + bandName
                                        + '"></i>'
                                        + '<span class="current-tooltip">'
                                        + current
                                        + '</span>'
                                        + '/'
                                        + '<span class="total-tooltip">'
                                        + total
                                        + '</span>'
                                        + '</div>'
                                        + '</div>'
                                        + '</div>';
                                }
                                else {
                                    tooltip += '<div class="area-tooltip">'
                                        + '<div class="area-tooltip-content">'
                                        + '<p class="label-opera label" '
                                        + 'style="cursor: pointer; color: #388ff7;" '
                                        + 'data-current-start-time="'
                                        + currentTime.duration.start
                                        + '" data-current-end-time="'
                                        + currentTime.duration.end
                                        + '">Label</p>'
                                        + '<div class="num-tooltip">'
                                        + '<i class="anticon anticon-caret-left load-trend"'
                                        + 'style="cursor: pointer; color: #388ff7" '
                                        + 'data-action="left" data-pre-start-time="'
                                        + pre.start
                                        + '" data-pre-end-time="'
                                        + pre.end
                                        + '" data-band-name="'
                                        + bandName
                                        + '"></i>'
                                        + '<span class="current-tooltip">'
                                        + current
                                        + '</span>'
                                        + '/'
                                        + '<span class="total-tooltip">'
                                        + total
                                        + '</span>'
                                        + '<i class="anticon anticon-caret-right load-trend"'
                                        + ' style="cursor: pointer; color: #388ff7" '
                                        + 'data-action="right" data-next-start-time="'
                                        + next.start
                                        + '" data-next-end-time="'
                                        + next.end
                                        + '" data-band-name="'
                                        + bandName
                                        + '"></i>'
                                        + '</div>'
                                        + '</div>'
                                        + '</div>';
                                }
                                break;
                            }
                        }
                    }
                }
                if (tooltip.length) {
                    return tooltip;
                }
                else {
                    return false;
                }
            }
            else {
                if (this.series.name === 'label line' && this.series.color === 'red') {
                    let menuList = '';
                    if (self.state.menuList.length) {
                        menuList += '<ul class="selection">';
                        for (let i = 0; i < self.state.menuList.length; i++) {
                            menuList += ''
                                + '<li style="cursor: pointer;" data-action="'
                                + self.state.menuList[i].action
                                + '">'
                                + self.state.menuList[i].name
                                + '</li>';
                        }
                        menuList += '</ul>';
                        return menuList;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
        };
        let mouseOverFunction = function (e) {
            window.currentOperaPoint = e;
            window.chartTrend = e.target.series.chart;
            window.currentIndex = e.target.index;
            window.currentX = e.target.x;
        };
        // The configuration parameters required for the trend graph
        let options = {
            lang: {
                noData: 'No data found in the uploaded file, please check.'
            },
            colors: ['#7cb5ec'],
            noData: {
                style: {
                    fontWeight: 'bold',
                    fontSize: '15px',
                    color: '#ccc'
                }
            },
            chart: {
                height: 500,
                zoomType: 'x',
                events: {
                    load: loadFunction,
                    selection: selectionFunction
                },
                animation: {
                    duration: 0
                }
            },
            title: {
                text: '',
                style: {
                    fontSize: '16px'
                }
            },
            scrollbar: {
                enabled: true,
                height: 0,
                buttonArrowColor: 'transparent',
                liveRedraw: false
            },
            navigator: {
                adaptToUpdatedData: false,
                enabled: true,
                maskFill: 'rgba(56,143,247,0.3)',
                height: 60,
                outlineWidth: 0,
                series: {
                    data: thumb,
                    type: 'line',
                    color: '#388FF7',
                    fillOpacity: 0,
                    dataGrouping: {
                        smoothed: true
                    },
                    lineWidth: 1,
                    lineColor: '#388FF7',
                    marker: {
                        enabled: false
                    },
                    name: 'sample demo'
                },
                type: 'datetime',
                dateTimeLabelFormats: {
                    second: '%Y-%m-%d<br/>%H:%M:%S',
                    minute: '%Y-%m-%d<br/>%H:%M',
                    hour: '%Y-%m-%d<br/>%H:%M',
                    day: '%Y<br/>%m-%d',
                    week: '%Y<br/>%m-%d',
                    month: '%Y-%m',
                    year: '%Y'
                }
            },
            rangeSelector: {
                // allButtonsEnabled: true,
                buttons: [{
                    type: 'hour',
                    count: 1,
                    text: '1h'
                }, {
                    type: 'hour',
                    count: 6,
                    text: '6h'
                }, {
                    type: 'hour',
                    count: 12,
                    text: '12h'
                }, {
                    type: 'day',
                    count: 1,
                    text: '1d'
                }, {
                    type: 'day',
                    count: 3,
                    text: '3d'
                }, {
                    type: 'day',
                    count: 7,
                    text: '7d'
                }, {
                    type: 'day',
                    count: 14,
                    text: '14d'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: false,
                buttonPosition: {
                    x: -5
                },
                buttonSpacing: 10,
                buttonTheme: { // styles for the buttons
                    'fill': 'none',
                    // stroke: 'none',
                    'stroke-width': 1,
                    'r': 1,
                    'style': {
                        color: '#aaa',
                        textShadow: 'none'
                    },
                    'states': {
                        hover: {
                            fill: '#388ff7',
                            style: {
                                color: 'white',
                                cursor: 'pointer',
                                textShadow: 'none'
                            }
                        },
                        select: {
                            fill: '#388ff7',
                            style: {
                                color: 'white',
                                textShadow: 'none'
                            }
                        }
                    }
                },
                labelStyle: {
                    display: 'none'
                }
            },
            tooltip: {
                shared: false,
                enabled: true,
                backgroundColor: '#fff',
                borderRadius: 1,
                borderWidth: 0,
                shadow: true,
                animation: true,
                style: {
                    fontSize: '12px',
                    pointerEvents: 'auto'
                },
                useHTML: true,
                formatter: tooltipFormatterFunction,
                hideDelay: 5000
            },
            xAxis: {
                crosshair: false,
                events: {
                    afterSetExtremes: afterSetExtremesFunction
                },
                type: 'datetime',
                dateTimeLabelFormats: {
                    second: '%Y-%m-%d<br/>%H:%M:%S',
                    minute: '%Y-%m-%d<br/>%H:%M',
                    hour: '%Y-%m-%d<br/>%H:%M',
                    day: '%Y<br/>%m-%d',
                    week: '%Y<br/>%m-%d',
                    month: '%Y-%m',
                    year: '%Y'
                }
            },
            yAxis: {
                max: max,
                min: min,
                opposite: false
            },
            legend: {
                enabled: false,
                symbolRadius: 0,
                symbolWidth: 25,
                squareSymbol: false,
                align: 'right',
                backgroundColor: '#fff',
                borderWidth: 0,
                layout: 'vertical',
                verticalAlign: 'top',
                y: 20,
                x: 20,
                width: 150,
                itemMarginTop: 5,
                itemMarginBottom: 10
            },
            plotOptions: {
                line: {
                    marker: {
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    },
                    point: {
                        events: {}
                    },
                    tooltip: {
                        hideDelay: 5000
                    }
                },
                area: {
                    point: {
                        events: {}
                    },
                    animation: false,
                    trackByArea: true
                },
                series: {
                    stickyTracking: false,
                    turboThreshold: 100000,
                    marker: {
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    },
                    states: {
                        hover: {
                            enabled: false
                        }
                    },
                    events: {
                    },
                    point: {
                        events: {
                            mouseOver: mouseOverFunction
                        }
                    }
                }
            }
        };
        let init = self.state.init;
        let params = {
            bandName: bandName,
            title: title,
            dataName: name,
            startTime: start,
            endTime: end,
            url: url,
            name: name,
            thumbUrl: thumbUrl,
            options: options,
            menuDisplay: menuDisplay,
            menuList: menuList,
            init: init,
            container: container
        };
        self.setState({
            options
        });
        return params;
    }

    // Rendering trend graphs, including trend graphs and thumbnails
    renderTrend(props) {
        const self = this;
        let options = self.getConfig(props);
        if (!options) {
            return;
        }
        self.getTrendData(options.url, options.options, undefined, false);
        self.getThumbTrendData(options.thumbUrl, options.options);
        return;
    }

    // Get the operation menu for the label line
    getOperaMenuData() {
        const self = this;
        let menuListUrl = api.getTooltipMenu;
        axiosInstance.get(menuListUrl).then(function (response) {
            const data = response.data;
            self.setState({
                menuList: data.data
            });
        });
    }

    // Rendering thumbnails trend graph
    getThumbTrendData(thumbUrl, options) {
        const self = this;
        axiosInstance.get(thumbUrl).then(function (response) {
            const data = response.data;
            let result = data.data.data;
            options.navigator.series.data = result;
            self.setState({
                container: options.container,
                options: options,
                type: 'stockChart'
            });
            window.thumbExtremes[self.props.params.name] = {
                max: result[result.length - 1][0],
                min: result[0][0]
            };
        });
    }

    // Get the width of the big trend graph
    getTrendWidth() {
        const self = this;
        let width = 0;
        if (self.state.bandMenuStyle) {
            width = document.body.clientWidth - 150 - 35;
        }
        else {
            width = document.body.clientWidth - 40 - 35;
        }
        if (self.props.params.menuDisplay === 'block') {
            width = width - 200;
        }
        return width;
    }

    // Rendering trend graph
    getTrendData(url, options, setExtremes, reflowThumb) {
        const self = this;
        if (!options) {
            options = self.state.options;
        }
        let chart = self.chart;
        if (chart) {
            chart.showLoading('Loading data, please wait...');
        }
        axiosInstance.get(url).then(function (response) {
            const data = response.data;
            let bands = data.data.bands;
            let trends = data.data.trends;
            let trendsBands = [];
            let trendsTrends = [];
            // Process trend graphs
            let result = [];
            // Handle the label line
            let resultLabel = [];
            let visibleFlag = false;
            let name = self.props.params.name;
            trends.map((item, i) => {
                if (item.type === 'arearange') {
                    item.lineWidth = 0;
                    item.color = 'rgba(48,225,40, 0.1)';
                    item.fillOpacity = 0.1;
                    item.zIndex = 1;
                    item.enableMouseTracking = false;
                    item.showInLegend = true;
                    trendsTrends.push(item);
                }
                if (item.type === 'line' || !item.type) {
                    if (item.name === 'base line') {
                        item.zIndex = 100;
                        item.lineWidth = 2;
                        item.color = '#388FF7';
                        item.data.map(data => {
                            result.push([data[0], data[1]]);
                            result.push([data[0], data[1]]);
                        });
                    }
                    if (item.name === 'label line') {
                        item.color = 'red';
                        item.showInLegend = false;
                        item.lineWidth = 2;
                        item.zIndex = 101;
                        item.enableMouseTracking = true;
                        item.data.map(data => {
                            resultLabel.push([data[0], data[1]]);
                            resultLabel.push([data[0], data[1]]);
                        });
                    }
                    trendsTrends.push(item);
                }
                if (item.type === 'area') {
                    item.lineWidth = 0;
                    item.fillOpacity = 0.3;
                    item.zIndex = -1;
                    item.enableMouseTracking = true;
                    trendsBands.push(item);
                    if (!visibleFlag) {
                        item.visible = true;
                        visibleFlag = true;
                        return;
                    }
                    item.visible = false;
                }
            });
            let selectedIndex = [];
            let tempStartTime;
            let tempEndTime;
            trends.map((item, i) => {
                if (item.name === 'base line') {
                    item.data = result;
                }
                if (item.name === 'label line') {
                    // window.labelObj[name] = [];
                    item.data = resultLabel;
                    item.data.map((data, j) => {
                        if (data[1]) {
                            // selectedIndex.push(j);
                            if (!data.events) {
                                data.events = {};
                            }
                            data.marker = {
                                symbol: 'circle'
                            };
                        }
                        else {
                            if (!data.events) {
                                data.events = {};
                            }
                        }
                    });
                }
            });
            options.yAxis.min = data.data.yAxis[0];
            options.yAxis.max = data.data.yAxis[1];
            options.series = trends;
            options.chart.width = self.getTrendWidth();
            clearInterval(self.loadingTime);
            if (self.refs.loadingContainer) {
                self.refs.loadingContainer.innerHTML = '';
            }
            self.setState({
                title: name,
                series: trends,
                trendSeries: trendsTrends,
                bandSeries: trendsBands,
                bands: bands,
                container: options.container,
                options: options,
                type: 'stockChart',
                loading: false,
                neverReflow: reflowThumb
            });
            eventProxy.trigger('loadBand');
            self.chart.hideLoading();
            eventProxy.trigger('loadTrend', {
                list: name
            });
        });
    }

    returnBands(bands) {
        this.setState({
            bands
        });
    }

    returnBandContent(bands) {
        this.setState({
            bandContent: bands
        });
    }

    afterSetExtremes(e) {
        const self = this;
        let trigger = ['navigator', 'rangeSelectorButton'];
        if (e.trigger) {
            if (trigger.indexOf(e.trigger) === -1) {
                return;
            }
            let url = api.getTrend
                + self.props.params.name
                + '/curves?'
                + 'startTime=' + Math.round(e.min)
                + '&endTime=' + Math.round(e.max);
            self.getTrendData(url, undefined, true, false);
        }
    }

    returnMenuList(menuList) {
        if (menuList.length) {
            this.setState({
                menuList
            });
        }
    }

    renderSummary() {
        const self = this;
        let name = self.props.params.name;
        let list = self.props.params.list;
        let summary;
        if (!list || !list.length) {
            return;
        }
        list.map(item => {
            if (item.name === name) {
                summary = item;
                return;
            }
        });
        if (summary === undefined) {
            return;
        }
        let period = moment(summary.time.start).format('YYYY-MM-DD HH:mm:ss')
            + '~' + moment(summary.time.end).format('YYYY-MM-DD HH:mm:ss');
        let length;
        if ((summary.period.ratio * 100 + '').split('.').length > 1) {
            length = 'Interval: '
                + summary.period.length + 's'
                + ' (' + (summary.period.ratio * 100 + '').split('.')[0]
                + '.'
                + (summary.period.ratio * 100 + '').split('.')[1].substring(0, 4) + ')%';
        }
        else {
            length = 'Interval: '
                + summary.period.length + 's'
                + ' (' + (summary.period.ratio * 100 + '').split('.')[0]
                + '.'
                + '00)%';
        }
        let labelRatio;
        if ((summary.labelRatio * 100 + '').split('.').length > 1) {
            labelRatio = (summary.labelRatio * 100 + '').split('.')[0]
                + '.'
                + (summary.labelRatio * 100 + '').split('.')[1].substring(0, 4) + '%';
        }
        else {
            labelRatio = (summary.labelRatio * 100 + '').split('.')[0]
                + '.'
                + '00%';
        }
        return (
            <p>
                <span className="title">{name}</span>
                <span className="brief">
                    <i>{period}</i>
                    <i>{length}</i>
                    <i>Anomaly percent: {labelRatio}</i>
                </span>
            </p>
        );
    }

    returnDataList(dataList) {
        eventProxy.trigger('refreshDataList', dataList);
    }

    returnChart(chart) {
        const self = this;
        self.chart = chart;
    }

    returnBandStyle(bandStyle) {
        this.setState({
            bandMenuStyle: bandStyle.bandMenuStyle,
            smallBandMenuStyle: bandStyle.smallBandMenuStyle
        });
    }

    render() {
        const self = this;
        if (self.props.params.list.length) {
            if (self.state.loading) {
                return (
                    <div className="loading-trend" ref="loadingContainer"></div>
                );
            }
            else {
                let options = self.state.options;
                if (options.chart) {
                    options.chart.width = self.getTrendWidth();
                }
                return (
                    <div>
                        <div className="trend">
                            <h3 className="summary">
                                {this.renderSummary()}
                            </h3>
                            <Band series={this.state.series}
                                  trendSeries={this.state.trendSeries}
                                  bandSeries={this.state.bandSeries}
                                  chart={this.refs.container}
                                  returnBandStyle={bandStyle => this.returnBandStyle(bandStyle)}
                                  init={this.state.init}
                            >
                            </Band>
                            <Chart ref="container"
                                   container={self.state.container}
                                   config={options}
                                   type={self.state.type}
                                   returnChart = {chart => this.returnChart(chart)}
                                   neverReflow={self.state.neverReflow}
                            />
                        </div>
                    </div>
                );
            }
        }
        else {
            return (
                <div className="trend no-data-list">
                    <div>
                        <img src={img} alt="no data" className="no-data-list-img"/>
                        <div className="no-data-list-tip">There is no data, yet</div>
                        <UploadData returnDataList={dataList => this.returnDataList(dataList)}
                                    type="trend"
                        ></UploadData>
                    </div>
                </div>
            );
        }
    }
}

