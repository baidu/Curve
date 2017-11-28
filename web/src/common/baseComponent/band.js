/**
 * @file band
 * @author cuiyuan
 */

import '../../index/component/sidebar.less';

import React, {Component} from 'react';
import eventProxy from '../../tools/eventProxy';
import cookie from 'react-cookies';

export default class Band extends Component {
    constructor(props) {
        super(props);

        this.state = {
            title: '',
            series: [],
            legend: {},
            bandMenuStyle: true,
            smallBandMenuStyle: false
        };
    }

    componentDidMount() {
        const self = this;
        self.initBand();
        eventProxy.on('loadBand', obj => {
            let legend = !self.isEmpty(self.state.legend[obj.name]) ? self.state.legend[obj.name] : {0: 'show'};
            self.state.legend[obj.name] = legend;
            cookie.save('bandStatus', self.state.legend);
            self.setState({
                legend: self.state.legend
            });
            eventProxy.trigger('bandVisible', legend);
        });
        eventProxy.on('loadedChart', chart => {
            self.setState({
                chart
            });
        });
        eventProxy.on('deleteLegend', name => {
            let legend = !self.isEmpty(self.state.legend[name]) ? self.state.legend[name] : {0: 'show'};
            delete self.state.legend[name];
            cookie.save('bandStatus', self.state.legend);
            self.setState({
                legend: self.state.legend
            });
        });
    }

    initBand() {
        const self = this;
        let bandSeries = self.props.bandSeries;
        let name = self.props.name;
        let legend = cookie.load('bandStatus') || self.state.legend || {};
        let list = self.props.list;
        list.map((item, index) => {
            if (!self.isEmpty(legend[item.name])) {

            }
            else {
                legend[item.name] = {};
                bandSeries.map((series, index) => {
                    if (!index) {
                        legend[item.name][index] = 'show';
                    }
                    else {
                        legend[item.name][index] = '';
                    }
                });
            }
        });
        cookie.save('bandStatus', legend);
        self.setState({
            legend
        });
    }

    // Determine whether the object is empty
    isEmpty(obj) {
        const self = this;
        for (let key in obj) {
            return false;
        }
        return true;
    }

    // Expand or collapse the right sidebar
    toggleBandMenu() {
        const self = this;
        let isShow;
        let isSmallShow;
        if (self.state.bandMenuStyle) {
            isShow = false;
            isSmallShow = true;
        }
        else {
            isShow = true;
            isSmallShow = false;
        }

        self.setState({
            bandMenuStyle: isShow,
            smallBandMenuStyle: isSmallShow
        });
        self.props.returnBandStyle({
            bandMenuStyle: isShow,
            smallBandMenuStyle: isSmallShow
        });
    }

    deleteBand() {

    }

    // Switch band display
    toggleBand(index, name) {
        const self = this;
        let legend = self.state.legend;
        let chart = self.state.chart;
        let series = {};
        let bandSeries = self.props.bandSeries;
        let dataName = self.props.name;
        chart.series.map((item, index) => {
            if (item.name === name) {
                series = chart.series[index];
            }
        });
        bandSeries.map((item, index) => {
            legend[dataName][index] = '';
        });
        if (series.visible) {
            series.hide();
            bandSeries.map((item, i) => {
                if (item.name === name) {
                    if (legend[dataName][i] === 'show') {
                        legend[dataName][i] = '';
                    }
                    else {
                        legend[dataName][i] = '';
                    }
                }
            });
        }
        else {
            series.show();
            bandSeries.map((item, i) => {
                if (item.name === name) {
                    if (legend[dataName][i] === '') {
                        legend[dataName][i] = 'show';
                    }
                    else {
                        legend[dataName][i] = '';
                    }
                }
            });
            chart.series.map((item, index) => {
                if (item.userOptions.type === 'area') {
                    chart.series[index].hide();
                }
                if (item.name === name) {
                    series = chart.series[index];
                    chart.series[index].show();
                }
            });
        }
        cookie.save('bandStatus', legend);
        self.setState({
            legend: legend
        });

    }

    // Render the band
    renderBand() {
        const self = this;
        let html = '';
        let classes = 'legend';
        let style = {};
        let color = '';
        let className = '';
        let chart = self.state.chart;
        let dataName = self.props.name;
        let legend = cookie.load('bandStatus') || self.state.legend || {};
        if (chart) {
            if (self.props.bandSeries && self.props.bandSeries.length) {
                html = self.props.bandSeries.map((item, index) => {
                    classes = 'legend ';
                    if (!legend[dataName]) {
                        legend[dataName] = {};
                    }
                    if (legend[dataName][index] === undefined) {
                        if (!index) {
                            legend[dataName][index] = 'show';
                        }
                        else {
                            legend[dataName][index] = '';
                        }
                    }
                    className = legend[dataName][index];
                    classes += className ? className : '';
                    chart.series.map((item, i) => {
                        if (item.name === self.props.bandSeries[index].name) {
                            color = item.color;
                            return;
                        }
                    });
                    style = {
                        background: !className
                        || className.length === 0 ? 'rgba(204,204,204, 0.3)' : color ? color : '#000',
                        opacity: 0.6
                    };
                    if (!index && className && className.length) {
                        style = {
                            background: color,
                            opacity: 0.6
                        };
                    }
                    return (
                        <label className={classes} key={index} onClick={self.toggleBand.bind(self, index, item.name)}>
                            <span className="symbol" style={style}></span>
                            {item.name}
                        </label>
                    );
                });
            }
            return html;
        }
    }

    // Render the reference line
    renderReferenceLine() {
        const self = this;
        let html = '';
        if (self.props.trendSeries && self.props.trendSeries.length) {
            html = self.props.trendSeries.map((item, index) => {
                if (item.type !== 'area') {
                    if (['base line', 'label line'].indexOf(item.name) === -1) {
                        return (
                            <label className="legend" key={index}>
                                <span className="symbol" style={{background: item.color ? item.color : '#000'}}></span>
                                {item.name}
                            </label>
                        );
                    }
                }
            });
        }
        return html;
    }

    render() {
        return (
            <div>
                <div className="band" style={{display: this.state.bandMenuStyle ? 'block' : 'none'}}>
                    <span className="fold-band">
                        <i className="anticon anticon-double-right" onClick={this.toggleBandMenu.bind(this)}></i>
                    </span>
                    <h4 className="reference-line">Reference</h4>
                    <div className="reference-line-content">
                        {this.renderReferenceLine()}
                    </div>
                    <h4 className="band-list">
                        Band
                        <i className="anticon anticon-calendar"></i>
                        <i className="anticon anticon-delete" onClick={this.deleteBand.bind(this)}></i>
                        <i className="anticon anticon-bars"></i>
                    </h4>
                    <div className="band-list-content">
                        {this.renderBand()}
                    </div>
                </div>
                <div className="small-band" style={{display: this.state.smallBandMenuStyle ? 'block' : 'none'}}>
                    <span className="fold-band">
                        <i className="anticon anticon-double-left" onClick={this.toggleBandMenu.bind(this)}></i>
                    </span>
                    <div className="small-reference-line"><i className="anticon anticon-appstore"></i></div>
                    <div className="small-band-list"><i className="anticon anticon-appstore"></i></div>
                </div>
            </div>
        );
    }
}
