/**
 * @file response
 * @author cuiyuan
 */

import '../../index/component/sidebar.less';
import React, {Component} from 'react';
import {axiosInstance} from '../../tools/axiosInstance';

const api = require('../../common/api').default.api;

export default class OperaMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: api.getTooltipMenu,
            menuList: []
        };
    }

    componentDidMount() {
        const self = this;
        axiosInstance.get(self.state.url).then(function (response) {
            const data = response.data;
            self.setState({
                menuList: data.data
            });
            self.props.returnMenuList(data.data);
        });
    }

    renderMenu() {
        const self = this;
        let html = '';
        let param = {};
        if (self.state.menuList && self.state.menuList.length) {
            html = self.state.menuList.map((item, index) => {
                param = {
                    name: item.name,
                    action: item.action,
                    dataName: self.props.name
                };
                return (
                    <li key={index}
                        onClick={this.menuClick.bind(this, param)}
                    >
                        {item.name}
                    </li>
                );
            });
            return html;
        }
    }

    menuClick(param) {
        let currentPoint = window.currentOperaPoint;
        // Gets the min and max of the current marked line segment
        let startTime;
        let endTime;
        let currentTime = currentPoint.target;
        let currentTimeIndex = 0;
        let chart = window.chartTrend;
        let series;
        chart.series.map((item, index) => {
            if (item.name === 'label line') {
                series = item;
                return;
            }
        });
        let points = series.points;
        currentTimeIndex = window.currentIndex;
        while (currentTimeIndex >= 0) {
            if (points[currentTimeIndex].y) {
                currentTimeIndex--;
            }
            else {
                startTime = points[currentTimeIndex + 1].x;
                break;
            }
        }
        currentTimeIndex = currentTime.index;
        while (currentTimeIndex <= points.length) {
            if (points[currentTimeIndex].y) {
                currentTimeIndex++;
            }
            else {
                endTime = points[currentTimeIndex - 1].x;
                break;
            }
        }
        let params = Object.assign(param, {
            startTime,
            endTime
        });
        let url = api.menuOpera
            + params.dataName
            + '?startTime=' + params.startTime
            + '&endTime=' + params.endTime
            + '&action=' + params.action;
        axiosInstance.put(url).then(function (response) {
            // console.log(response)
        });
    }

    render() {
        return (
            <ul className="selection">
                {this.renderMenu()}
            </ul>
        );
    }
}
