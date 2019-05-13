/**
 * @file MFTable multifunction table component
 * @author cuiyuan
 */

import './table.less';

import React, {Component} from 'react';
import moment from 'moment';
import {Link, hashHistory} from 'react-router';
import {axiosInstance} from '../../tools/axiosInstance';
import {viewListConfig} from '../../config/MFTableConfig';
import eventProxy from '../../tools/eventProxy';
import Sidebar from './sidebar';
import MFTable from './mftable';
import Outdent from 'react-icons/lib/fa/dedent';
import Dialog from '../../common/baseComponent/dialog';
import MessageTip from '../../common/baseComponent/messageTip';

// icon
// search
import SearchIcon from 'react-icons/lib/fa/search';
// view
import Eye from 'react-icons/lib/fa/eye';
// delete
import Trash from 'react-icons/lib/fa/trash';
// export
import Download from 'react-icons/lib/fa/download';
// close
import Close from 'react-icons/lib/fa/close';

// const {Sider, Content} = Layout;
// api
const api = require('../../common/api').default.api;
// Header, prompt box, batch operation configuration
const {header, dialog, batchAction} = viewListConfig;

// const
// Operation column width
const ACTION_ITEM_WIDTH = 180;
// padding of cell
const PADDING_WIDTH = 10;
// Check box width
const CHECKBOX_WIDTH = 12;

// operation icon，true：view/show icon，false：hide icon；
const actionIconMap = {
    delete: false,
    view: false,
    export: false
};

export default class Table extends Component {
    constructor(props) {
        super(props);

        // The width of the initialization cell is auto and the initialization operation icon is displayed
        let width = [];
        header.forEach((item, index) => {
            if (item.value === 'action') {
                item.children.forEach(item => {
                    actionIconMap[item.value] = true;
                });
            }
            else {
                if (index < header.length - 1) {
                    width.push('auto');
                }
            }
        });
        this.state = {
            // sidebar list
            sidebarList: [],
            // Display upload mask layer, true means display, false means hidden
            showUploading: false,
            // Shows loading trend graph, true means display, false means hidden
            showLoading: false,
            // Show mask layer, true means display, false means hidden
            showContainerOverlay: false,
            // Bullet frame configuration
            dialogConfig: {},
            // Sidebar expansion, true means collapse, false means expansion
            foldMenu: false
        };
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.toggleContainerOverlay = this.toggleContainerOverlay.bind(this);
        this.showUploading = this.showUploading.bind(this);
        this.hideUploading = this.hideUploading.bind(this);
    }

    componentDidMount() {

    }

    componentWillUnmount() {

    }

    setList(list) {
        this.setState({
            sidebarList: list
        });
        this.refs.sidebar.setList(list);
    }

    toggleSidebar() {
        this.setState({
            foldMenu: !this.state.foldMenu
        }, () => {
            this.refs.mftable.setWindowWidth();
        });
    }

    showLoading () {
        this.setState({
            showLoading: true
        });
    }

    hideLoading() {
        this.setState({
            showLoading: false
        });
    }

    uploadingProcess(percent) {
        this.setState({
            uploadingProcess: 398 * (percent - 10) / 100 + 'px'
        });
    }

    // add item
    updateList(data, callback) {
        let self = this;
        this.state.sidebarList.push(data);
        this.setState({
            sidebarList: this.state.sidebarList
        });
        if (callback && typeof callback === 'function') {
            callback(this.state.sidebarList);
        }
        // eventProxy.trigger('list', {
        //     list: self.state.sidebarList
        // });
        this.refs.mftable.setList(self.state.sidebarList);
    }

    deleteData(name, dialogConfig) {
        this.setState({
            dialogConfig,
            showContainerOverlay: true,
            showContainerOverlayBackgroundColor: dialogConfig.dialogOverlayBackgroundColor
        });
    }


    toggleContainerOverlay(isShow) {
        this.setState({
            showContainerOverlay: isShow
        });
        if (!isShow) {
            this.refs.sidebar.toggleSummary();
        }
    }

    showUploading() {
        this.setState({
            showUploading: true
        });
    }

    hideUploading() {
        this.setState({
            showUploading: false
        });
    }

    render() {
        let overlayWidth = document.body.clientWidth;
        let overlayHeight = document.body.clientHeight + 50 > 580 ? document.body.clientHeight + 50 : 580 + 50;
        let uploadingWidth = document.body.clientWidth - 200;
        let uploadingHeight = document.body.clientHeight > 580 ? document.body.clientHeight : 580;
        let sidebarClassName;
        if (!this.state.foldMenu) {
            sidebarClassName = 'unfold-menu';
        }
        else {
            sidebarClassName = 'fold-menu';
        }
        return (
            <div>
                <Sidebar dataName={this.props.params.name}
                         setList={list => this.setList(list)}
                         list={this.state.sidebarList}
                         showUploading={this.showUploading}
                         hideUploading={this.hideUploading}
                         updateList={(data, callback) => this.updateList(data, callback)}
                         uploadingProcess={percent => this.uploadingProcess(percent)}
                         showLoading={this.showLoading}
                         hideLoading={this.hideLoading}
                         toggleContainerOverlay={this.toggleContainerOverlay}
                         deleteData={(name, dialogConfig) => this.deleteData(name, dialogConfig)}
                         foldMenu={this.state.foldMenu}
                         showAll={false}
                         ref="sidebar"
                         type="list"
                ></Sidebar>
                <Outdent className={sidebarClassName}
                         onClick={this.toggleSidebar}
                ></Outdent>
                <MFTable list={this.state.sidebarList}
                         setList={list => this.setList(list)}
                         foldMenu={this.state.foldMenu}
                         showLoading={this.showLoading}
                         hideLoading={this.hideLoading}
                         ref="mftable"></MFTable>
                <div className="uploading" style={{
                    display: this.state.showUploading ? 'block' : 'none',
                    width: uploadingWidth + 'px',
                    height: uploadingHeight + 'px'
                }}>
                    <div className="uploading-container">
                        <div className="uploading-process" style={{width: this.state.uploadingProcess}}></div>
                    </div>
                    <p className="uploading-text">Uploading and pre-processing, please wait</p>
                </div>
                <div className="trend-loading loading" style={{
                    display: this.state.showLoading ? 'block' : 'none',
                    width: overlayWidth + 'px',
                    height: overlayHeight + 'px'
                }}><div className="loading-img"></div></div>
                <div className="container-overlay" style={{
                    display: this.state.showContainerOverlay ? 'block' : 'none',
                    width: overlayWidth - 200 + 'px',
                    height: overlayHeight + 'px',
                    left: '200px'
                }} onClick={isShow => this.toggleContainerOverlay(false)}></div>
                <Dialog ref="dialog"
                        showLoading={this.showLoading}
                        hideLoading={this.hideLoading}
                ></Dialog>
                <MessageTip ref="messageTip"></MessageTip>
            </div>
        );
    }
}