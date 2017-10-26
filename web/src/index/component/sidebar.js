/**
 * @file sidebar
 * @author cuiyuan
 */
import './sidebar.less';

import React, {Component} from 'react';
import {Link, hashHistory} from 'react-router';
import {Button} from 'antd';
import {axiosInstance} from '../../tools/axiosInstance';
import eventProxy from '../../tools/eventProxy';
import UploadData from '../../common/baseComponent/uploadData';
import moment from 'moment';
import $ from 'jquery';

const api = require('../../common/api').default.api;

export default class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.isShow = {};
        this.state = {
            // The list of data on the left
            dataList: [],
            // Controls whether the summary is displayed
            isShow: {},
            // Calculate the position of the summary
            top: 0,
            init: true,
            // Control the left side of the data list to select the style
            active: {}
        };
    }

    componentDidMount() {
        const self = this;
        let isShow = {};
        // Render the left side of the data list
        this.renderList();
        // Hide the boot page
        eventProxy.on('hideSummary', obj => {
            for (let key in self.state.isShow) {
                isShow[key] = false;
            }
            self.setState({
                isShow
            });
        });
        // Calculate the summary trigger position
        $('body').delegate('.data-list li', 'mouseenter', function (e) {
            $('.view-summary').hide();
            let top = 36 * $(this).index() - $('.data-list-container').scrollTop() + 18 + 50 + 10;
            $(this).find('.view-summary').css('top', top + 'px');
            $(this).find('.view-summary').show();
        });
        // refresh the left side of the data list
        eventProxy.on('refreshDataList', dataList => {
            let list = self.state.dataList.concat(dataList);
            self.setState({
                dataList: list
            });
        });
    }

    // Click on the left navigation data operation
    dataListClick(name) {
        const self = this;
        let list = self.state.dataList;
        let active = {};
        list.map((item, index) => {
            active[item.name] = false;
            if (item.name === name) {
                active[item.name] = true;
            }
        });
        this.setState({
            init: false,
            active: active
        });
    }

    /**
     * Render the left side of the data list
     */
    renderList() {
        const self = this;
        let url = api.getDataList;
        axiosInstance.get(url).then(function (response) {
            const data = response.data;
            let name = data.data && data.data.length ? data.data[0].name : '';
            let url = '/home/' + name;
            if (self.props.params.name !== name && self.props.params.name !== undefined) {
                url = '/home/' + self.props.params.name;
            }
            hashHistory.push(url);
            self.setState({
                dataList: data.data,
                name: name
            });
            self.props.returnSummary(name, data.data);
        });
    }

    // get the position of the summary
    getItemPosition(e) {
        let target = $(e.target).closest('li');
        let top = 36 * target.index() - $('.data-list-container').scrollTop() + 18 + 50 + 10 + 4;
        return {
            top,
            target
        };
    }

    // Show or hide summary
    toggleSummary(e, name) {
        e.stopPropagation();
        const self = this;
        let top = self.getItemPosition(e).top;
        let isShow = {};
        let dataList = self.state.dataList;
        dataList.map((item, index) => {
            if (!isShow[item.name]) {
                isShow[item.name] = false;
            }
            if (item.name === name) {
                if (isShow[item.name]) {
                    isShow[item.name] = false;
                }
                else {
                    isShow[item.name] = true;
                }
            }
            else {
                isShow[item.name] = false;
            }
            if (self.state.isShow[item.name] === true) {
                isShow[item.name] = false;
            }
        });
        self.setState({
            isShow,
            top
        });
        let showFlag = false;
        for (let key in isShow) {
            if (isShow[key]) {
                showFlag = true;
                break;
            }
        }
        if (self.props.overlay) {
            if (showFlag) {
                self.props.overlay.style.display = 'block';
            }
            else {
                self.props.overlay.style.display = 'none';
            }
        }
    }

    // Render the summary
    renderDataList() {
        const self = this;
        let dataList;
        let html;
        dataList = self.state.dataList;
        let isShow;
        html = dataList.map((item, i) => {
            let start = moment(item.time.start).format('YYYYMMDD');
            let end = moment(item.time.end).format('YYYYMMDD');
            let ratio;
            if ((item.period.ratio * 100 + '').split('.').length > 1) {
                ratio = ''
                    + item.period.length + 's'
                    + ' (' + (item.period.ratio * 100 + '').split('.')[0]
                    + '.'
                    + (item.period.ratio * 100 + '').split('.')[1].substring(0, 2) + ')%';
            }
            else {
                ratio = ''
                    + item.period.length + 's'
                    + ' (' + (item.period.ratio * 100 + '').split('.')[0]
                    + '.'
                    + '00)%';
            }
            let labelRatio;
            if ((item.labelRatio * 100 + '').split('.') > 1) {
                labelRatio = (item.labelRatio * 100 + '').split('.')[0]
                    + '.'
                    + (item.labelRatio * 100 + '').split('.')[1].substring(0, 2) + '%';
            }
            else {
                labelRatio = (item.labelRatio * 100 + '').split('.')[0]
                    + '.'
                    + '00%';
            }
            let className = '';
            if (self.state.init && i === 0) {
                className = 'active';
            }
            else {
                if (self.state.active[item.name]) {
                    className = 'active';
                }
                else {
                    className = '';
                }
            }
            if (self.state.dataList.length) {
                if (self.props.params.name !== self.state.dataList[0].name) {
                    className = '';
                }
                if (self.props.params.name === item.name) {
                    className = 'active';
                }
            }
            let link = '/home/' + item.name;
            isShow = self.state.isShow[item.name] ? 'block' : 'none';
            return (
                <li key={i}
                    onClick={this.dataListClick.bind(this, item.name)}
                    title={item.name}
                    className={className}
                >
                    <Link to={link} className="link">
                        <span className="data-name">
                            <i className="data-name-content" title={item.name}>
                                {item.name}
                            </i>

                        </span>
                    </Link>
                    <div className="view-summary"
                         onClick={e => this.toggleSummary(e, item.name)}
                    >
                        <i></i>
                        <i></i>
                        <i></i>
                    </div>
                    <div className="summary-content"
                             style={{display: isShow,
                                 top: self.state.top + 'px'}}
                        >
                            <h4 className="summary-content-head">{item.name}</h4>
                            <div className="summary-content-body">
                                <div className="summary-content-item">
                                    <span>Data range: </span>
                                    <span>{start} ~ {end}</span>
                                </div>
                                <div className="summary-content-item">
                                    <span>Interval: </span>
                                    <span>{ratio}</span>
                                </div>
                                <div className="summary-content-item">
                                    <span>Anomaly percent: </span>
                                    <span>{labelRatio}</span>
                                </div>
                            </div>
                            <div className="summary-content-footer">
                                <Button className="opera-button">View</Button>
                                <Button className="opera-button">Export</Button>
                                <Button className="opera-button"
                                        onClick={this.deleteData.bind(this, item.name)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                </li>
            );
        });
        return html;
    }

    // delete data
    deleteData(name) {
        // const self = this;
        // axiosInstance.delete();
    }

    returnDataList(dataList) {
        const self = this;
        let list = self.state.dataList.concat(dataList);
        self.setState({
            dataList: list
        });
        return list;
    }

    render() {
        let link = 'list';
        return (
            <div>
                <div style={{position: 'relative', zIndex: '1'}}>
                    <div className="data-set">
                        <span className="dataset">Data</span>
                        <Link to={link} className="link"><span className="show-all">Show All</span></Link>
                    </div>
                    <UploadData returnDataList={dataList => this.returnDataList(dataList)}></UploadData>
                    <div className="data-list-container" style={{maxHeight: '500px', overflowY: 'auto'}}>
                        <ul className="data-list" style={{height: this.props.height + 'px'}}>
                            {this.renderDataList()}
                        </ul>
                    </div>

                </div>
            </div>
        );
    }
}
