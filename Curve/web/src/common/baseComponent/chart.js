/**
* @file highcharts component
* @author mohaiyan
*/

import React, {Component, PropTypes} from 'react';
import Highcharts from 'highcharts/highstock';
import {NoDataToDisplay} from 'react-highcharts-no-data-to-display';
import highchartsMore from 'highcharts/highcharts-more';
import eventProxy from '../../tools/eventProxy';

highchartsMore(Highcharts);
let ReactHighcharts = require('react-highcharts/ReactHighstock');
NoDataToDisplay(ReactHighcharts.Highcharts);


// import HighchartsMore from 'highcharts/highcharts-more';
// var RHighcharts = require('react-highcharts/ReactHighstock');
// HighchartsMore(RHighcharts.Highcharts);

Highcharts.setOptions({
    global: {
        useUTC: false
    }
});

export default class Chart extends Component {
    constructor(props) {
        super(props);
    }

    renderChart(config) {
        if (!config) {
            throw new Error('Config must be specified for the component');
        }

        const defaultConfig = {
            credits: {
                enabled: false
            },
            colors: ['#7cb5ec', '#80699B', '#90ed7d', '#f7a35c', '#8085e9',
            '#f15c80', '#e4d354', '#8085e8', '#8d4653', '#91e8e1']
        };

        config = Object.assign({}, defaultConfig, config);
        let chartConfig = config.chart;
        let chartType = this.props.type || 'chart';

        this.chart = new Highcharts[chartType]({
            ...config,
            chart: {
                ...chartConfig,
                renderTo: this.refs.chart
            }
        }, this.props.callback);
        // eventProxy.trigger('loadedChart', this.chart);
        if (!this.props.neverReflow) {
            this.chart && this.chart.options && this.chart.reflow();
        }
        this.props.returnChart(this.chart);
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.neverReflow || (nextProps.isPureConfig && this.props.config === nextProps.config)) {
            return true;
        }
        this.renderChart(nextProps.config);
        return false;
    }

    getChart() {
        if (!this.chart) {
            throw new Error('getChart() should not be called before the component is mounted');
        }
        return this.chart;
    }

    componentDidMount() {
        this.renderChart(this.props.config);
    }

    componentWillUnmount() {
        this.chart.destroy();
    }

    render() {
        return <div className="chart-container" ref="chart" {...this.props.domProps} />;
    }
}

Chart.propTypes = {
    config: PropTypes.object.isRequired,
    isPureConfig: PropTypes.bool,
    neverReflow: PropTypes.bool,
    callback: PropTypes.func,
    domProps: PropTypes.object
};

