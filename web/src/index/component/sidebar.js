/**
 * @file sidebar
 * @author cuiyuan
 */
import './sidebar.less';

import React, {Component} from 'react';
import {Link, hashHistory} from 'react-router';
import {axiosInstance} from '../../tools/axiosInstance';
import eventProxy from '../../tools/eventProxy';
import UploadData from '../../common/baseComponent/uploadData';
import moment from 'moment';
import $ from 'jquery';

const api = require('../../common/api').default.api;
const dateFormat = 'YYYY-MM-DD HH:mm';

export default class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // Sidebar list
            list: [],
            // The summary, true for displaying data, the display, false for hiding
            showSummary: {},
            // Responsible for displaying three points, true means display, false means hidden
            showViewSummaryTrigger: {},
            // Height of summary
            top: {}
        };
        this.updateList = this.updateList.bind(this);
        this.showViewSummaryTrigger = this.showViewSummaryTrigger.bind(this);
        this.hideViewSummaryTrigger = this.hideViewSummaryTrigger.bind(this);
        this.dataClick = this.dataClick.bind(this);
        this.exportData = this.exportData.bind(this);
        this.deleteData = this.deleteData.bind(this);
        this.showAll = this.showAll.bind(this);
    }

    componentDidMount() {
        // Get sidebar data
        this.getList();
    }

    getList() {
        let url = api.getDataList;
        axiosInstance.get(url).then(response => {
            const data = response.data;
            let list = data.data;
            this.props.setList(list);
            let showSummary = {};
            let showViewSummaryTrigger = {};
            let top = {};
            list.forEach(item => {
                showSummary[item.name] = false;
                showViewSummaryTrigger[item.name] = false;
                top[item.name] = 0;
            });
            this.setState({
                showSummary,
                showViewSummaryTrigger,
                top,
                list
            });
        });
    }

    toggleSummary(e, name, index) {
        for (let dataName in this.state.showSummary) {
            if (dataName !== name) {
                this.state.showSummary[dataName] = false;
            }
        }
        if (e || name) {
            e.stopPropagation();
            this.state.showSummary[name] = !this.state.showSummary[name];
            let scrollTop = this.refs.dataListContainer.scrollTop;
            let offsetTop = this.refs['li' + name].offsetTop;
            let top = offsetTop - scrollTop + 'px';
            this.state.top[name] = top;
            this.props.toggleContainerOverlay(true);
            this.setState({
                showSummary: this.state.showSummary,
                top: this.state.top
            });
        }
        else {
            this.setState({
                showSummary: this.state.showSummary
            });
        }
    }

    showViewSummaryTrigger(e, name) {
        e.preventDefault();
        this.state.showViewSummaryTrigger[name] = true;
        this.setState({
            showViewSummaryTrigger: this.state.showViewSummaryTrigger
        });
    }

    hideViewSummaryTrigger(e, name) {
        e.preventDefault();
        this.state.showViewSummaryTrigger[name] = false;
        this.setState({
            showViewSummaryTrigger: this.state.showViewSummaryTrigger
        });
    }

    dataClick(e, name) {
        e.stopPropagation();
        if (e.target.className === 'data-name-content' || e.target.nodeName === 'LI') {
            if (this.props.dataName !== name) {
                this.props.showLoading();
            }
        }
    }

    exportData(e, name) {
        e.stopPropagation();
        let url = api.exportData + name;
        window.open(url);
    }

    deleteData(e, name) {
        let self = this;
        e.stopPropagation();
        let url = api.deleteData + name;
        eventProxy.trigger('beforeOpenDialog', {
            dialogTitle: 'Delete',
            dialogContent: 'Are you sure you want to delete ' + name + '?',
            dialogType: 'confirm',
            dialogShow: true,
            dialogOverlayBackgroundColor: 'rgba(0, 0, 0, 0.4)',
            dialogParams: {
                name,
                url
            },
            dialogCallback: {
                okCallback: function (args) {
                    let list = self.props.list;
                    let index = 0;
                    for (let i = 0; i < list.length; i ++) {
                        if (list[i].name === args) {
                            index = i;
                            break;
                        }
                    }
                    let firstDataName = list[0].name;
                    let nextDataName = null;
                    let nextUrl = '';
                    if (index < list.length - 1){
                        nextDataName = list[index + 1].name;
                    }
                    if (nextDataName) {
                        nextUrl = '/home/' + nextDataName;
                    }
                    else {
                        if (firstDataName) {
                            nextUrl = '/home/' + firstDataName;
                        }
                    }
                    list.splice(index, 1);
                    self.props.setList(list);
                    self.props.hideLoading();
                    hashHistory.push(nextUrl);
                },
                cancelCallback: function (args) {
                    self.props.hideLoading();
                }
            },
            dialogCallbackMessage: {
                success: 'Successfully deleted, the next data will be displayed',
                error: 'Delete failed, please try again'
            }
        });
    }

    setList(list) {
        this.setState({
            list
        });
    }

    renderSidebar(props) {
        // let dataList = props.list ? props.list : this.props.list || this.state.list;
        let dataList = this.state.list;
        return dataList.map((item, index) => {
        let link = '/home/' + item.name;
            let start = moment(item.display.start).format(dateFormat);
            let end = moment(item.display.end).format(dateFormat);
            let ratio = item.period.ratio;
            let labelRatio = item.labelRatio;
            return (
                <li key={index}
                    onClick={(e, name) => this.dataClick(e, item.name)}
                    onMouseOver={(e, name) => this.showViewSummaryTrigger(e, item.name)}
                    onMouseOut={(e, name) => this.hideViewSummaryTrigger(e, item.name)}
                    title={item.name}
                    className={item.name === this.props.dataName ? 'active' : ''}
                    ref={'li' + item.name}
                >
                    <Link to={link} className="link">
                    <span className="data-name">
                        <i className="data-name-content" title={item.name}>
                            {item.name}
                        </i>

                    </span>
                    </Link>
                    <div className="view-summary"
                         style={{display: this.state.showViewSummaryTrigger[item.name] ? 'inline-block' : 'none'}}
                         onClick={(e, name, index) => this.toggleSummary(e, item.name, index)}
                    >
                        <i></i>
                        <i></i>
                        <i></i>
                    </div>
                    <div className="summary-content" style={{
                        display: this.state.showSummary[item.name] ? 'inline-block' : 'none',
                        top: this.state.top[item.name]
                    }}
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
                            <button className="opera-button"
                                    onClick={(e, name) => this.exportData(e, item.name)}
                            >
                                Export
                            </button>
                            <button className="opera-button"
                                    onClick={(e, name) => this.deleteData(e, item.name)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </li>
            );
        });
    }

    componentWillUnmount(){
        this.setState = (state,callback)=>{
            return;
        };
    }

    showAll() {
        hashHistory.push('/table');
    }

    updateList(data, callback) {
        const self = this;
        this.props.updateList(data, function (list) {
            self.setState({
                list
            });
        });
    }

    render() {
        let clientHeight = document.body.clientHeight > 560 ? document.body.clientHeight : 560;
        return (
            <div className="index-sidebar" style={{
                height: clientHeight + 'px',
                left: this.props.foldMenu ? '-200px' : 0
            }}>
                <div className="data-set">
                    <span className="dataset">Data</span>
                    <span className="show-all" onClick={this.showAll}
                          style={{display: this.props.showAll ? 'block' : 'none'}}
                    >Show All</span>
                </div>
                <UploadData type={this.props.type}
                            // list={this.state.list}
                            showUploading={this.props.showUploading}
                            hideUploading={this.props.hideUploading}
                            uploadingProcess={percent => this.props.uploadingProcess(percent)}
                            updateList={name => this.updateList(name)}
                ></UploadData>
                <div className="data-list-container" ref="dataListContainer" style={{maxHeight: '450px', overflowY: 'auto'}}>
                    <ul className="data-list">
                        {this.renderSidebar(this.props)}
                    </ul>
                </div>
            </div>
        );
    }
}
