/**
 * @file sidebar
 * @author cuiyuan
 */
import './sidebar.less';

import React, {Component} from 'react';
import {message} from 'antd';
import {Link, hashHistory} from 'react-router';
import {Button, Icon} from 'antd';
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
        this.dataListClick = this.dataListClick.bind(this);
    }

    componentDidMount() {
        const self = this;
        let isShow = {};
        // Render the left side of the data list
        this.renderList();
        // Hide the boot page
        eventProxy.on('hideSummary', obj => {
            for (let key in this.state.isShow) {
                isShow[key] = false;
            }
            this.setState({
                isShow
            });
        });
        // Calculate the summary trigger position
        $('body').delegate('.data-list li', 'mouseenter', function (e) {
            $('.view-summary').hide();
            let top = 36 * $(this).index() - $('.data-list-container').scrollTop() + 18 + 50 + 10;
            $(this).find('.view-summary').css('top', top + 'px');
            // If the current hover data height is not enough 20 pixels, do not show the summary prompt
            let diffHeight = $('.data-list-container').height() - (36 * $(this).index() - $('.data-list-container').scrollTop());
            if (diffHeight >= 20) {
                $(this).find('.view-summary').show();
            }
        });
        // Hide the view-summary dom and summary panel
        $('.data-list-container, .data-list').scroll(function () {
            $('.data-list .view-summary').hide();
            for (let key in self.state.isShow) {
                isShow[key] = false;
            }
            self.setState({
                isShow
            });
        });
        // refresh the left side of the data list
        eventProxy.on('refreshDataList', dataList => {
            this.setState({
                dataList: this.state.dataList.concat(dataList)
            });
        });
        // confirm delete data
        eventProxy.on('confirmDialog', name => {
            let url = api.deleteData + name;
            axiosInstance.delete(url).then(function (response) {
                self.refs.overlayBlack.style.display = 'none';
                self.refs.dialog.style.display = 'none';
                eventProxy.trigger('deleteLegend', name);
                let dataList = self.state.dataList;
                let nextName = '';
                if (dataList.length > 1) {
                    for (let i = 0; i < dataList.length; i++) {
                        if (dataList[i].name === name) {
                            nextName = dataList[i + 1] ? dataList[i + 1].name : dataList[0].name;
                            dataList.splice(i, 1);
                            break;
                        }
                    }
                }
                else {
                    nextName = '';
                    dataList = [];
                }
                let isShow = self.state.isShow;
                delete isShow[name];
                let nextUrl =  '/home/' + nextName;
                // redirect new router
                hashHistory.push(nextUrl);
                if (!dataList.length) {
                    window.location.reload();
                }
            });
        });

        // open dialog
        eventProxy.on('openDialog', obj => {
            this.refs.overlayBlack.style.display = 'block';
            this.refs.dialog.style.display = 'block';
            this.setState({
                dialogTitle: obj.title,
                dialogContent: obj.content,
                dialogName: obj.name,
                dialogType: obj.type
            });
            if (typeof obj.callback === 'function') {
                obj.callback();
            }
        });
    }

    // Click on the left navigation data operation
    dataListClick(name) {
        let list = this.state.dataList;
        let active = {};
        if (typeof name === 'string') {
            list.forEach(item => {
                active[item.name] = false;
                if (item.name === name) {
                    active[item.name] = true;
                }
            });
            eventProxy.trigger('loadingTip');
            this.setState({
                init: false,
                active: active
            });
        }
    }

    componentWillUnmount(){
        this.setState = (state,callback)=>{
            return;
        };
    }

    /**
     * Render the left side of the data list
     */
    renderList() {
        const self = this;
        let url = api.getDataList;
        axiosInstance.get(url).then(function (response) {
            const data = response.data;
            if (data.msg === 'redirect' && data.data.length) {
                window.location.href = data.data;
                return;
            }
            let name = data.data && data.data.length ? data.data[0].name : '';
            let url = '/home/' + name;
            if (self.props.params.name !== name && self.props.params.name !== undefined) {
                url = '/home/' + self.props.params.name;
            }
            let nameList = data.data.map(item => {
                return item.name;
            });
            if (data.data.length) {
                if (window.location.hash.split('/').length === 2 && window.location.hash.split('/')[1].indexOf('table') !== -1) {
                    url = '/table';
                    hashHistory.push(url);
                    return;
                }
                // The correct name exists
                if (nameList.indexOf(self.props.params.name) !== -1) {
                    eventProxy.trigger('loadingTip');
                    self.redirect(url, data, name);
                }
                // If the current name is not in the data list, the default jumps to the first one
                else {
                    let showName = self.props.params.name ? self.props.params.name : '';
                    if (showName) {
                        message.warning('No ' + showName + ' Data', 2, function () {
                            url = '/home/' + name;
                            self.redirect(url, data, name);
                        });
                    }
                    else {
                        self.redirect(url, data, name);
                    }
                }
            }
        });
    }

    // redirect page
    redirect(url, data, name) {
        hashHistory.push(url);
        this.setState({
            dataList: data.data,
            name
        });
        this.props.returnSummary(name, data.data);
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
        let top = this.getItemPosition(e).top;
        let isShow = {};
        let dataList = this.state.dataList;
        dataList.forEach(item => {
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
            if (this.state.isShow[item.name] === true) {
                isShow[item.name] = false;
            }
        });
        this.setState({
            isShow,
            top,
            toggle: true
        });
        let showFlag = false;
        for (let key in isShow) {
            if (isShow[key]) {
                showFlag = true;
                break;
            }
        }
        if (this.props.overlay) {
            if (showFlag) {
                this.props.overlay.style.display = 'block';
            }
            else {
                this.props.overlay.style.display = 'none';
            }
        }
    }

    // Render the summary
    renderDataList() {
        let dataList = this.state.dataList.length === 0 ? this.props.list : this.state.dataList;
        let isShow;
        return dataList.map((item, i) => {
            let start = moment(item.time.start).format('YYYYMMDD');
            let end = moment(item.time.end).format('YYYYMMDD');
            let ratio;
            if ((item.period.ratio * 100 + '').split('.').length > 1) {
                ratio = ''
                    + item.period.length + 's'
                    + ' (' + (item.period.ratio * 100 + '').split('.')[0]
                    + '.'
                    + (item.period.ratio * 100 + '').split('.')[1].substring(0, 4) + ')%';
            }
            else {
                ratio = ''
                    + item.period.length + 's'
                    + ' (' + (item.period.ratio * 100 + '').split('.')[0]
                    + '.'
                    + '00)%';
            }
            let labelRatio;
            if ((item.labelRatio * 100 + '').split('.').length > 1) {
                labelRatio = (item.labelRatio * 100 + '').split('.')[0]
                    + '.'
                    + (item.labelRatio * 100 + '').split('.')[1].substring(0, 4) + '%';
            }
            else {
                labelRatio = (item.labelRatio * 100 + '').split('.')[0]
                    + '.'
                    + '00%';
            }
            let className = '';
            if (this.state.init && i === 0) {
                className = 'active';
            }
            else {
                if (this.state.active[item.name]) {
                    className = 'active';
                }
                else {
                    className = '';
                }
            }
            if (dataList.length) {
                if (this.props.params.name !== dataList[0].name) {
                    className = '';
                }
                if (this.props.params.name === item.name) {
                    className = 'active';
                }
                else {
                    className = '';
                }
            }
            let link = '/home/' + item.name;
            isShow = this.state.isShow[item.name] ? 'block' : 'none';
            return (
                <li key={i}
                    onClick={this.dataListClick.bind(item.name)}
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
                         style={{display: isShow, top: this.state.top + 'px'}}
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
                            <Button className="opera-button"
                                    onClick={this.exportData.bind(this, item.name)}
                            >
                                Export
                            </Button>
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
    }

    // delete data
    deleteData(name) {
        eventProxy.trigger('openDialog', {
            title: 'Delete',
            content: 'Are you sure you want to delete ' + name + '?',
            name,
            type: 'confirm'
        });
    }

    // export data
    exportData(name) {
        window.open(api.exportData + name);
    }

    returnDataList(dataList) {
        let list = this.state.dataList.length === 0 ? this.props.list.concat(dataList) : this.state.dataList.concat(dataList);
        this.setState({
            dataList: list
        });
        return list;
    }

    dialogConfirm(name) {
        eventProxy.trigger('confirmDialog', name);
    }

    dialogCancel(){
        this.refs.overlayBlack.style.display = 'none';
        this.refs.dialog.style.display = 'none';
    }

    showAll(url) {
        hashHistory.push(url);
        this.props.showItem();
    }

    render() {
        return (
            <div>
                <div style={{position: 'relative', zIndex: '1'}}>
                    <div className="data-set">
                        <span className="dataset">Data</span>
                        <span className="show-all" onClick={this.showAll.bind(this, '/table')} style={{display: this.props.showAll ? 'inline-block' : 'none'}}>Show All</span>
                    </div>
                    <UploadData returnDataList={dataList => this.returnDataList(dataList)}
                                type="sidebar"
                    ></UploadData>
                    <div className="data-list-container" style={{maxHeight: '450px', overflowY: 'auto'}}>
                        <ul className="data-list"
                        >
                            {this.renderDataList()}
                        </ul>
                    </div>
                </div>
                <div className="overlay-black" ref="overlayBlack" style={{display: 'none'}}></div>
                <div className="dialog" ref="dialog" style={{display: 'none'}}>
                    <div className="dialog-header">
                        <div className="dialog-title">{this.state.dialogTitle}</div>
                        <Icon type="close" className="dialog-close" onClick={this.dialogCancel.bind(this, this.state.dialogName)}></Icon>
                    </div>
                    <div className="dialog-body">
                        <div className="dialog-content">{this.state.dialogContent}</div>
                        <div className="dialog-footer">
                            <button className="confirm operation-btn"
                                    style={{display: !this.state.dialogType || this.state.dialogType === 'confirm' ? 'inline-block' : 'none'}}
                                    ref="dialogConfirm"
                                    onClick={this.dialogConfirm.bind(this, this.state.dialogName)}>Delete</button>
                            <button className="cancel operation-btn"
                                    ref="dialogCancel"
                                    onClick={this.dialogCancel.bind(this, this.state.dialogName)}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
