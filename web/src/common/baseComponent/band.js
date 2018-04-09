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
            let trendsBands = obj.trendsBands;
            let initLegend = {};
            trendsBands.forEach((item, index) => {
                if (!index) {
                    initLegend[item.name] = 'show';
                }
                else {
                    initLegend[item.name] = '';
                }
            });
            let legend = !self.isEmpty(self.state.legend[obj.name]) ? self.state.legend[obj.name] : initLegend;
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
            delete this.state.legend[name];
            cookie.save('bandStatus', this.state.legend);
            this.setState({
                legend: this.state.legend
            });
        });
    }

    componentWillUnmount(){
        this.setState = (state,callback)=>{
            return;
        };
    }

    initBand() {
        let self = this;
        let bandSeries = this.props.bandSeries;
        let legend = cookie.load('bandStatus') || this.state.legend || {};
        let list = this.props.list;
        list.forEach(item => {
            if (self.isEmpty(legend[item.name])) {
                legend[item.name] = {};
                bandSeries.forEach((series, index) => {
                    if (!index) {
                        legend[item.name][series.name] = 'show';
                    }
                    else {
                        legend[item.name][series.name] = '';
                    }
                });
            }
        });
        cookie.save('bandStatus', legend);
        this.setState({
            legend
        });
    }

    // Determine whether the object is empty
    isEmpty(obj) {
        for (let key in obj) {
            return false;
        }
        return true;
    }

    // Expand or collapse the right sidebar
    toggleBandMenu() {
        let isShow;
        let isSmallShow;
        if (this.state.bandMenuStyle) {
            isShow = false;
            isSmallShow = true;
        }
        else {
            isShow = true;
            isSmallShow = false;
        }

        this.setState({
            bandMenuStyle: isShow,
            smallBandMenuStyle: isSmallShow
        });
        this.props.returnBandStyle({
            bandMenuStyle: isShow,
            smallBandMenuStyle: isSmallShow
        });
    }

    deleteBand() {

    }

    // Switch band display
    toggleBand(name) {
        let legend = this.state.legend;
        let chart = this.state.chart;
        let series = {};
        let bandSeries = this.props.bandSeries;
        let dataName = this.props.name;
        chart.series.forEach((item, index) => {
            if (item.name === name) {
                series = chart.series[index];
            }
        });
        bandSeries.forEach((item, index) => {
            legend[dataName][item.name] = '';
        });
        if (series.visible) {
            series.hide();
            bandSeries.forEach((item, i) => {
                if (item.name === name) {
                    if (legend[dataName][item.name] === 'show') {
                        legend[dataName][item.name] = '';
                    }
                    else {
                        legend[dataName][item.name] = '';
                    }
                }
            });
        }
        else {
            series.show();
            bandSeries.forEach((item, i) => {
                if (item.name === name) {
                    if (legend[dataName][item.name] === '') {
                        legend[dataName][item.name] = 'show';
                    }
                    else {
                        legend[dataName][item.name] = '';
                    }
                }
            });
            chart.series.forEach((item, index) => {
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
        this.setState({
            legend: legend
        });

    }

    // Render the band
    renderBand() {
        let chart = this.state.chart;
        let dataName = this.props.name;
        let legend = cookie.load('bandStatus') || this.state.legend || {};
        if (chart) {
            if (this.props.bandSeries && this.props.bandSeries.length) {
                return this.props.bandSeries.map((item, index) => {
                    let classes = 'legend ';
                    if (!legend[dataName]) {
                        legend[dataName] = {};
                    }
                    if (legend[dataName][item.name] === undefined) {
                        if (!index) {
                            legend[dataName][item.name] = 'show';
                        }
                        else {
                            legend[dataName][item.name] = '';
                        }
                    }
                    let className = legend[dataName][item.name];
                    classes += className ? className : '';
                    let color = '';
                    chart.series.forEach(item => {
                        if (item.name === this.props.bandSeries[index].name) {
                            color = item.color;
                            return;
                        }
                    });
                    let style = {
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
                        <label className={classes} key={index} onClick={this.toggleBand.bind(this, item.name)}>
                            <span className="symbol" style={style}></span>
                            {item.name}
                        </label>
                    );
                });
            }
        }
    }

    // Render the reference line
    renderReferenceLine() {
        if (this.props.trendSeries && this.props.trendSeries.length) {
            return this.props.trendSeries.map((item, index) => {
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
