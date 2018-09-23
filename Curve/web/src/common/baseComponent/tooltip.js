/**
 * @file response
 * @author cuiyuan
 */

import '../../index/component/sidebar.less';
import '../../index/component/trend.less';

import React, {Component} from 'react';
import {Icon} from 'antd';

const api = require('../../common/api').default.api;

export default class Tooltip extends Component {
    constructor(props) {
        super(props);

        this.state = {
            bands: []
        };
    }

    componentDidMount() {}

    renderAreaToolTip() {
        const self = this;
        let bandContent = self.props.bands;
        let html;
        if (bandContent && bandContent.length) {
            html = bandContent.map((item, index) => {
                let name = item.name;
                let bands = item.bands;
                return bands.map((band, i) => {
                    let className;
                    if (band.index && band.index.length) {
                        className = 'area-tooltip area-tooltip' + '-series' + index + '-' + band.index.join('-');
                        return (
                            <div className={className} key={i}>
                                <div className="area-tooltip-content">
                                    <p className="label" onClick={this.label.bind(this, name)}>Label</p>
                                    <div className="num-tooltip">
                                        <Icon type="caret-left"
                                              className="left"
                                              onClick={this.loadTrend.bind(this, name, band, 'left')}
                                              style={{display: band.preTime ? 'block' : 'none'}}
                                        />
                                        <span className="current-tooltip">{band.bandNo}</span>
                                        /
                                        <span className="total-tooltip">{band.bandCount}</span>
                                        <Icon type="caret-right"
                                              className="right"
                                              onClick={this.loadTrend.bind(this, name, band, 'right')}
                                              style={{display: band.nextTime ? 'block' : 'none'}}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    }
                });
            });
            return html;
        }
    }

    label() {

    }

    loadTrend(bandName, band, type) {
        const self = this;
        let name = self.props.name;
        let thumbUrl = api.getThumbTrend + name + '/thumb';
        let startTime = 0;
        let endTime = 0;
        if (type === 'left') {
            if (band.preTime) {
                startTime = band.preTime.start;
                endTime = band.preTime.end;
            }
        }
        else if (type === 'right') {
            if (band.nextTime) {
                startTime = band.nextTime.start;
                endTime = band.nextTime.end;
            }
        }
        let url = api.getTrend
            + name
            + '/curves?'
            + 'startTime=' + startTime
            + '&endTime=' + endTime
            + '&bandName=' + bandName;
        self.props.returnTrend({
            url: url,
            params: {
                bandName: bandName,
                dataName: name
            },
            thumbUrl: thumbUrl
        });
    }

    render() {
        return (
            <div className="tooltips">
                {this.renderAreaToolTip()}
            </div>
        );
    }
}
