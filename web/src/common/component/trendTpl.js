/**
 * @file trend
 * @author cuiyuan
 */

import React, {PropTypes} from 'react';
import Highcharts from 'highcharts/highstock';
import Chart from '../baseComponent/chart';
import {axiosInstance} from '../../tools/axiosInstance';
import Band from '../../common/baseComponent/band';
import OperaMenu from '../../common/baseComponent/operaMenu';
import Tooltip from '../../common/baseComponent/tooltip';
import $ from 'jquery';

export default class TrendTpl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            title: '',
            series: [],
            trendSeries: [],
            bandSeries: [],
            legend: {},
            bandMenuStyle: true,
            smallBandMenuStyle: false,
            thumb: [],
            firstLoadThumb: true
        };
    }

    tooltipFormatter() {
        const self = this;
        const time = Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', self.x);
        let seriesTooltip = [];

        self.points.map((itemPoints, keyPoints) => {
            let html = '<span style="color: ' + itemPoints.series.color + '">'
                        + itemPoints.series.name + ': </span>'
                        + '<span style="color: ' + itemPoints.series.color + '"> '
                        + itemPoints.y + '</span>';
            seriesTooltip.push(html);
        });
        return time + '<br />' + seriesTooltip.join('<br />');
    }

    renderTrend(props) {
        const self = this;
        axiosInstance.get(props.url).then(function (response) {
            const data = response.data;
            let bands = data.data.bands;
            let trends = data.data.trends;
            let trendsBands = [];
            let trendsTrends = [];
            let name = props.params.dataName;
            // Process trend graphs
            let result = [];
            // Handle the label line
            let resultLabel = [];
            let visibleFlag = false;
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
            trends.map((item, i) => {
                if (item.name === 'base line') {
                    item.data = result;
                }
                if (item.name === 'label line') {
                    item.data = resultLabel;
                    item.data.map((data, j) => {
                        if (data[1]) {
                            selectedIndex.push(j);
                            if (!data.events) {
                                data.events = {};
                            }
                            data.marker = {
                                symbol: 'circle'
                            };
                            data.events.mouseOver = function (e) {
                                e.preventDefault();
                                $('.selection').show();
                                $('.selection').css({
                                    left: e.target.plotX - 5 + 'px',
                                    top: e.target.plotY + 'px'
                                });
                            };
                        }
                        else {
                            if (!data.events) {
                                data.events = {};
                            }
                            data.events.mouseOver = function (e) {
                                e.preventDefault();
                                $('.selection').hide();

                            };
                        }
                    });

                    if (props.setExtremes) {
                        window.selectedIndex[name] = [];
                    }
                    else {
                        if (!window.selectedIndex[name]) {
                            window.selectedIndex[name] = [];
                        }
                    }

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
                    return;
                }
            });
            let tmpSelectedIndex = [];
            let resultIndex = [];
            for (let i = 0; i < window.selectedIndex[name].length; i++) {
                if (window.selectedIndex[name][i] + 1 === window.selectedIndex[name][i + 1]) {
                    tmpSelectedIndex.push(window.selectedIndex[name][i]);
                }
                else {
                    tmpSelectedIndex.splice(0, 1);
                    resultIndex.push(tmpSelectedIndex);
                    tmpSelectedIndex = [];
                }
            }
            let finalSelectedIndex = [];
            resultIndex.map(arr => {
                finalSelectedIndex = finalSelectedIndex.concat(arr);
            });
            window.selectedIndex[name] = finalSelectedIndex;
            let bandData = [];
            let bandX = [];
            let bandStart;
            let bandEnd;
            let trendIndex = 0;
            let start;
            let end;
            bands.map((band, index) => {
                trends.map((trend, i) => {
                    if (trend.name === band.name) {
                        trendIndex = i;
                        return;
                    }
                });
                bandData = trends[trendIndex].data;
                bandData.map((data, i) => {
                    bandX.push(data[0]);
                });
                band.bands.map((item, i) => {
                    start = item.currentTime.duration.start;
                    end = item.currentTime.duration.end;
                    bandStart = bandX.indexOf(start) === -1 ? null : bandX.indexOf(start);
                    bandEnd = bandX.indexOf(end) === -1 ? null : bandX.indexOf(end);
                    if (bandStart && bandEnd) {
                        for (let j = bandStart; j <= bandEnd; j++) {
                            if (!item.index) {
                                item.index = [];
                            }
                            item.index.push(j);
                        }
                    }
                });
                bandX = [];
                bandData = [];
            });
            self.setState({
                title: props.params.dataName,
                series: trends,
                trendSeries: trendsTrends,
                bandSeries: trendsBands,
                bands: bands,
                max: data.data.yAxis[1],
                min: data.data.yAxis[0]
            });
            self.chart.hideLoading();
        });
        if (!props.setExtremes && props.firstLoadThumb) {
            let thumbUrl = props.thumbUrl;
            axiosInstance.get(thumbUrl).then(function (response) {
                const data = response.data;
                self.setState({
                    thumb: data.data.data,
                    firstLoadThumb: false
                });
            });
        }
    }

    componentDidMount() {
        this.renderTrend(this.props);
        this.props.returnChart(this.refs.container);
    }

    shouldComponentUpdate(nextProps) {
        if (this.props.params === nextProps.params) {
            return true;
        }

        this.renderTrend(nextProps);
        return false;
    }

    renderReferenceLine() {
        const self = this;
        let html = '';
        if (self.state.series && self.state.series.length) {
            html = self.state.series.map((item, index) => {
                if (item.type !== 'area' && index) {
                    return (
                        <label className="legend" key={index}>
                            <span className="symbol" style={{background: item.color ? item.color : '#000'}}></span>
                            {item.name}
                        </label>
                    );
                }
            });
        }
        return html;
    }

    renderBand() {
        const self = this;
        let html = '';
        let classes = 'legend';
        let style = {};
        let className = '';
        if (self.state.series && self.state.series.length) {
            html = self.state.series.map((item, index) => {
                if (index >= 3) {
                    classes = 'legend ';
                    className = self.state.legend[index];
                    classes += className ? className : '';
                    style = {
                        background: className ? 'rgba(204,204,204, 0.3)' : item.color ? item.color : '#000'
                    };
                    return (
                        <label className={classes} key={index} onClick={self.toggleBand.bind(self, index)}>
                            <span className="symbol"
                                  style={style}
                            ></span>
                            {item.name}
                        </label>
                    );
                }
            });
        }
        return html;
    }

    toggleBand(index) {
        const self = this;
        let legend = self.state.legend;
        if (self.chart.series[index].visible) {
            self.chart.series[index].hide();
            self.chart.series.map((item, i) => {
                if (i === index) {
                    if (legend[i] !== 'hide') {
                        legend[i] = 'hide';
                    }
                }
                else {
                    if (legend[i] === 'hide') {

                    }
                    else {
                        legend[i] = '';
                    }
                }
            });
        }
        else {
            self.chart.series[index].show();
            self.chart.series.map((item, i) => {
                if (i === index) {
                    if (legend[i] === 'hide') {
                        legend[i] = '';
                    }
                }
                else {
                    if (legend[i] === 'hide') {

                    }
                    else {
                        legend[i] = '';
                    }
                }
            });
        }
        self.setState({
            legend
        });
    }

    returnChart(chart) {
        this.chart = chart;
    }

    deleteBand() {

    }

    returnMenuList(menuList) {
        this.props.returnMenuList(menuList);
    }

    returnBandStyle(bandStyle) {
        this.setState({
            bandMenuStyle: bandStyle.bandMenuStyle,
            smallBandMenuStyle: bandStyle.smallBandMenuStyle
        });
    }

    returnTrend(url) {
        this.renderTrend(url);
    }

    render() {
        const defaultConfig = {
            title: {
                margin: 0,
                text: ''
            },

            chart: {
                height: 250
            },
            subtitle: {
                text: ''
            },
            yAxis: {
                minPadding: 0,
                opposite: false
            },
            exporting: {
                enabled: false
            },
            rangeSelector: {
                enabled: false
            },
            navigator: {
                enabled: false
            },
            scrollbar: {
                enabled: false
            },
            tooltip: {
                enabled: true,
                shared: true,
                crosshairs: true,
                useHTML: true,
                valueDecimals: 3
            },
            legend: {
                enabled: true,
                align: 'center',
                margin: 0,
                verticalAlign: 'bottom',
                borderWidth: 0,
                itemStyle: {
                    cursor: 'pointer',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 'normal'
                }
            },
            series: this.state.series
        };
        const container = this.props.container;
        const self = this;
        let width;
        if (this.state.bandMenuStyle) {
            width = document.body.clientWidth - 150 - 35;
        }
        else {
            width = document.body.clientWidth - 40 - 35;
        }
        if (self.props.menuDisplay === 'block') {
            width = width - 200;
        }
        else if (self.props.menuDisplay === 'none') {
        }
        const options = Object.assign(defaultConfig, this.props.config);
        options.navigator.series.data = this.state.thumb;
        options.chart.width = width;
        const type = 'stockChart';
        const title = this.props.title ? this.props.title : this.state.title;
        const legend = this.state.legend;
        let max = this.state.max;
        let min = this.state.min;

        return (
            <div>
                <Chart ref="container"
                       container={container}
                       config={options}
                       type={type}
                       max={max}
                       min={min}
                       returnChart = {chart => this.returnChart(chart)}
                       legend={legend}
                />
                <Band series={this.state.series}
                      trendSeries={this.state.trendSeries}
                      bandSeries={this.state.bandSeries}
                      chart={this.refs.container}
                      returnBandStyle={bandStyle => this.returnBandStyle(bandStyle)}
                      setExtremes={this.props.setExtremes}
                      init={this.props.init}
                >
                </Band>

                <Tooltip bands={this.state.bands}
                         name={title}
                         returnTrend={url => this.returnTrend(url)}
                >
                </Tooltip>
                <OperaMenu returnMenuList={menuList => this.returnMenuList(menuList)} name={title}></OperaMenu>
            </div>
        );
    }
}

TrendTpl.propTypes = {
    url: PropTypes.string.isRequired,
    params: PropTypes.object,
    container: PropTypes.string,
    config: PropTypes.object
};
