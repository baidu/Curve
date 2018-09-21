/**
 * @file response
 * @author cuiyuan
 */

import './index.less';

import React, {Component} from 'react';
import Sidebar from './sidebar';
import Trend from './trend';
import Dialog from '../../common/baseComponent/dialog';
import MessageTip from '../../common/baseComponent/messageTip';
import eventProxy from '../../tools/eventProxy';
import guidePage from '../../common/image/guide-page.png';
import Outdent from 'react-icons/lib/fa/dedent';


// const {Sider, Content} = Layout;

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // Sidebar data
            list: [],
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
        this.showUploading = this.showUploading.bind(this);
        this.uploadingProcess = this.uploadingProcess.bind(this);
        this.hideUploading = this.hideUploading.bind(this);
        this.updateList = this.updateList.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.toggleContainerOverlay = this.toggleContainerOverlay.bind(this);
        this.deleteData = this.deleteData.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.returnChart = this.returnChart.bind(this);
    }

    componentDidMount() {

    }

    setList(list) {
        this.setState({
            list
        });
    }

    showUploading() {
        this.setState({
            showUploading: true
        });
    }

    uploadingProcess(percent) {
        this.setState({
            uploadingProcess: 398 * (percent - 10) / 100 + 'px'
        });
    }

    hideUploading() {
        this.setState({
            showUploading: false
        });
    }

    updateList(data, callback) {
        this.state.list.push(data);
        this.setState({
            list: this.state.list
        });
        if (callback && typeof callback === 'function') {
            callback(this.state.list);
        }
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

    toggleContainerOverlay(isShow) {
        this.setState({
            showContainerOverlay: isShow
        });
        if (!isShow) {
            this.refs.sidebar.toggleSummary();
        }
    }

    deleteData(name, dialogConfig) {
        this.setState({
            dialogConfig,
            showContainerOverlay: true,
            showContainerOverlayBackgroundColor: dialogConfig.dialogOverlayBackgroundColor
        });
    }

    toggleSidebar() {
        this.setState({
            foldMenu: !this.state.foldMenu
        }, () => {
            this.refs.trend.redrawTrend();
        });
    }

    returnChart(chart) {

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
                         list={this.state.list}
                         showUploading={this.showUploading}
                         hideUploading={this.hideUploading}
                         updateList={(data, callback) => this.updateList(data, callback)}
                         uploadingProcess={percent => this.uploadingProcess(percent)}
                         showLoading={this.showLoading}
                         toggleContainerOverlay={this.toggleContainerOverlay}
                         deleteData={(name, dialogConfig) => this.deleteData(name, dialogConfig)}
                         foldMenu={this.state.foldMenu}
                         showAll={true}
                         ref="sidebar"
                         type="trend"
                ></Sidebar>
                <Outdent className={sidebarClassName}
                         onClick={this.toggleSidebar}
                ></Outdent>
                <Trend dataName={this.props.params.name}
                       list={this.state.list}
                       hideLoading={this.hideLoading}
                       foldMenu={this.state.foldMenu}
                       ref="trend"
                ></Trend>
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
                <div className="trend-loading" style={{
                    display: this.state.showLoading ? 'block' : 'none',
                    width: uploadingWidth + 'px',
                    height: uploadingHeight + 'px',
                    paddingTop: uploadingHeight / 2 + 'px'
                }}>
                    The trend is loading, please wait
                </div>
                <div className="container-overlay" style={{
                    display: this.state.showContainerOverlay ? 'block' : 'none',
                    width: overlayWidth - 200 + 'px',
                    height: overlayHeight + 'px',
                    left: '200px'
                }} onClick={isShow => this.toggleContainerOverlay(false)}></div>
                <Dialog ref="dialog"></Dialog>
                <MessageTip ref="messageTip"></MessageTip>
            </div>
        );
    }
}
