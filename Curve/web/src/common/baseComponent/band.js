/**
 * @file band
 * @author cuiyuan
 */

import './band.less';

import React, {Component} from 'react';
import cookie from 'react-cookies';
import AngleRight from 'react-icons/lib/fa/angle-double-right';
import Calendar from 'react-icons/lib/fa/calendar';
import Save from 'react-icons/lib/fa/floppy-o';
import AngleLeft from 'react-icons/lib/fa/angle-double-left';
import Bars from 'react-icons/lib/fa/bars';
import Thlarge from 'react-icons/lib/fa/th-large';

export default class Band extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // Current data name
            dataName: this.props.dataName,
            // Current data collection
            series: this.props.series,
            // Band display, true means to collapse, false to expand
            foldMenu: false,
            // Trend object
            chart: {},
            // Legend object
            legend: {},
            // Store band data
            bandSeries: []
        };
        this.toggleBandMenu = this.toggleBandMenu.bind(this);
        this.toggleBand = this.toggleBand.bind(this);
        this.saveBand = this.saveBand.bind(this);
    }

    componentDidMount() {

    }

    componentWillUnmount(){
        this.setState = (state,callback)=>{
            return;
        };
    }

    initBand(chart) {
        let series = chart.series;
        let bandSeries = [];
        let dataName = this.props.dataName;
        // init bandSeries
        series.forEach(item => {
            if (item.type === 'area') {
                bandSeries.push(item);
            }
        });
        // init legend
        let legend = cookie.load('bandStatus') || this.state.legend || {};
        this.props.list.forEach(item => {
            if (this.isEmpty(legend[item.name])) {
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
        bandSeries.forEach((item, index) => {
            if (index === 0 && legend[dataName][item.name] === 'show') {
                item.visible = true;
            }
            else if (index !== 0 && legend[dataName][item.name] === 'show') {
                item.visible = true;
            }
            else if (index === 0 && legend[dataName][item.name] === '') {
                item.visible = false;
            }
            else {
                item.visible = false;
            }
        });
        this.setState({
            chart,
            bandSeries,
            legend
        }, () => {
            cookie.save('bandStatus', legend);
        });
    }

    // Determine whether the object is empty
    isEmpty(obj) {
        for (let key in obj) {
            return false;
        }
        return true;
    }

    toggleBand(name) {
        let dataName = this.props.dataName;
        let legend = this.state.legend;
        let bandSeries = [];
        let series = {};
        this.state.chart.series.forEach(item => {
            if (item.name === name && item.type === 'area') {
                series = item;
                bandSeries.push(item);
            }
        });
        if (series.visible) {
            series.hide();
            // update band series
            bandSeries.forEach(item => {
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
            // update band series
            bandSeries.forEach(item => {
                if (item.name === name) {
                    if (legend[dataName][item.name] === '') {
                        legend[dataName][item.name] = 'show';
                    }
                    else {
                        legend[dataName][item.name] = '';
                    }
                }
            });
            // only show one band
            this.state.chart.series.forEach((item, index) => {
                if (item.type === 'area') {
                    this.state.chart.series[index].hide();
                }
                if (item.name === name) {
                    this.state.chart.series[index].show();
                }
            });
        }
        this.setState({
            legend,
            bandSeries
        }, () => {
            cookie.save('bandStatus', legend);
        });
    }

    renderReferenceLine() {
        // line and arearange
        return this.props.series.map((item, index) => {
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

    toggleBandMenu() {
        this.setState({
            foldMenu: !this.state.foldMenu
        }, () => {
            this.props.redrawTrend(<this className="state foldMenu"></this>);
        });
    }

    renderBand() {
        let bandSeries = [];
        this.props.series.map(item => {
            if (item.type === 'area') {
                bandSeries.push(item);
            }
        });
        bandSeries = this.state.bandSeries || bandSeries;
        return bandSeries.map((item, index) => {
            if (item.type === 'area') {
                if (['base line', 'label line'].indexOf(item.name) === -1) {
                    let backgroundColor = '';
                    if (index === 0 && !item.visible) {
                        backgroundColor = 'rgba(204,204,204, 0.3)';
                    }
                    else if (index === 0 && item.visible) {
                        backgroundColor = item.color;
                    }
                    else if (index !== 0 && !item.visible) {
                        backgroundColor = 'rgba(204,204,204, 0.3)';
                    }
                    else {
                        backgroundColor = 'rgba(204,204,204, 0.3)';
                    }
                    return (
                        <label className="legend" key={index}
                               onClick={name => this.toggleBand(item.name)}
                        >
                            <span className="symbol"
                                  style={{background: backgroundColor}}
                            ></span>
                            {item.name}
                        </label>
                    );
                }
            }

        });
    }

    saveBand() {

    }

    render() {
        return (
            <div>
                <div className="band" style={{
                    display: this.state.foldMenu ? 'none' : 'block'
                }}>
                <span className="fold-band">
                    <AngleRight className="angle-left" onClick={this.toggleBandMenu}></AngleRight>
                </span>
                    <h4 className="reference-line">Reference</h4>
                    <div className="reference-line-content">
                        {this.renderReferenceLine()}
                    </div>
                    <h4 className="band-list">
                        Band
                        <Calendar className="action-calendar" title="Jump next band"></Calendar>
                        <Save className="action-save" onClick={this.saveBand} title="Save current status of bands"></Save>
                    </h4>
                    <div className="band-list-content">
                        {this.renderBand()}
                    </div>
                </div>
                <div className="small-band" style={{
                    display: this.state.foldMenu ? 'block' : 'none'
                }}>
                    <span className="fold-band">
                        <AngleLeft className="angle-right" onClick={this.toggleBandMenu}></AngleLeft>
                    </span>
                    <div className="small-reference-line"><Bars></Bars></div>
                    <div className="small-band-list"><Thlarge></Thlarge></div>
                </div>
            </div>
        );
    }
}
