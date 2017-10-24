/**
 * @file band
 * @author cuiyuan
 */

import '../../index/component/sidebar.less';

import React, {Component} from 'react';
import eventProxy from '../../tools/eventProxy';

export default class Band extends Component {
    constructor(props) {
        super(props);

        this.state = {
            title: '',
            series: [],
            legend: {},
            bandMenuStyle: true,
            smallBandMenuStyle: false,
            init: true
        };
    }

    componentDidMount() {
        const self = this;
        this.renderBand();
        eventProxy.on('loadBand', obj => {
            self.setState({
                init: true,
                legend: {}
            });
        });
        eventProxy.on('loadedChart', chart => {
            self.setState({
                chart
            });
        });
    }

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

    toggleBand(index, name) {
        const self = this;
        let legend = self.state.legend;
        let chart = self.state.chart;
        let series = {};
        let bandSeries = self.props.bandSeries;
        chart.series.map((item, index) => {
            if (item.name === name) {
                series = chart.series[index];
            }
        });
        bandSeries.map((item, index) => {
            legend[index] = '';
        });
        if (series.visible) {
            series.hide();
            bandSeries.map((item, i) => {
                if (item.name === name) {
                    if (legend[i] === 'show') {
                        legend[i] = '';
                    }
                    else {
                        legend[i] = '';
                    }
                }
            });
        }
        else {
            series.show();
            bandSeries.map((item, i) => {
                if (item.name === name) {
                    if (legend[i] === '') {
                        legend[i] = 'show';
                    }
                    else {
                        legend[i] = '';
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

        self.setState({
            legend: legend,
            init: false
        });

    }

    renderBand() {
        const self = this;
        let html = '';
        let classes = 'legend';
        let style = {};
        let color = '';
        let init = self.state.init;
        let className = '';
        let chart = self.state.chart;
        if (chart) {
            if (self.props.bandSeries && self.props.bandSeries.length) {
                html = self.props.bandSeries.map((item, index) => {
                    classes = 'legend ';
                    className = self.state.legend[index];
                    classes += className ? className : '';
                    chart.series.map((item, i) => {
                        if (item.name === self.props.bandSeries[index].name) {
                            color = item.color;
                        }
                    });
                    style = {
                        background: !className
                        || className.length === 0 ? 'rgba(204,204,204, 0.3)' : color ? color : '#000'
                    };
                    if (init && !index) {
                        style = {
                            background: color
                        };
                    }
                    return (
                        <label className={classes} key={index} onClick={self.toggleBand.bind(self, index, item.name)}>
                    <span className="symbol"
                          style={style}
                    ></span>
                            {item.name}
                        </label>
                    );
                });
            }
            return html;
        }
    }

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
