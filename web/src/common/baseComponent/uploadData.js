/**
 * @file response
 * @author cuiyuan
 */

import '../../index/component/sidebar.less';
import '../../index/component/trend.less';
import './loading.less';
import React, {Component} from 'react';
import {Button, Icon, message} from 'antd';
import eventProxy from '../../tools/eventProxy';
import Upload from 'rc-upload';
import {hashHistory} from 'react-router';
import $ from 'jquery';

const api = require('../../common/api').default.api;

export default class UploadData extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dataList: [],
            fileName: ''
        };
    }

    componentDidMount() {

    }

    render() {
        const self = this;
        let dataName = this.state.fileName;
        const props = {
            name: 'file',
            action: api.uploadData + dataName,
            showUploadList: {
                showPreviewIcon: false,
                showRemoveIcon: false
            },
            headers: {
                Authorization: 'authorization-text'
            },
            beforeUpload(file) {
                // console.log('beforeUpload', file.name);
                self.setState({
                    fileName: file.name.split('.')[0]
                });
            },
            onStart(file) {
                // console.log('onStart', file.name);
                // this.refs.inner.abort(file);
                self.setState({
                    dataList: self.props.dataList ? self.props.dataList : self.state.dataList,
                    fileName: file.name.split('.')[0]
                });
                let html = '';
                html = '<div class="loading-process">'
                    // + '<div class="loading-text">' + Math.round(step.percent) + '</div>'
                    + '<div class="loading-container">'
                    + '<div class="loading" style="width:' + 0 + 'px' + '"></div>'
                    + '</div>'
                    + '<p>Uploading and pre-processing, please wait<span class="loading-dot"></span></p>'
                    + '</div>';
                if (!$('.trend').find('.loading-process').length) {
                    $('.trend').append(html);
                }
            },
            onSuccess(result, file) {
                // console.log('onSuccess', file);
                let dataList = self.state.dataList.concat(result.data);
                $('.trend').find('.loading-process .loading').width(398);
                message.success(self.state.fileName + ' upload successful');
                $('.trend').find('.loading-process').remove();
                clearInterval(window.timeIds);
                clearInterval(window.timeIds1);
                let list = [];
                if (self.props.type === 'sidebar') {
                    list = self.props.returnDataList(dataList);
                }
                else {
                    list = dataList;
                }
                let url = '/home/' + result.data.name;
                hashHistory.push(url);
                eventProxy.trigger('loadTrend', {
                    list,
                    type: self.props.type
                });
            },
            onProgress(step, file, result) {
                // console.log('onProgress', Math.round(step.percent), file.name);
                let num = 1;
                window.timeIds = setInterval(function () {
                    if (num === 1) {
                        $('.loading-dot').text('.');
                    }
                    else if (num === 2) {
                        $('.loading-dot').text('..');
                    }
                    else if (num === 3) {
                        $('.loading-dot').text('...');
                        num = 0;
                    }
                    num++;
                }, 800);
                window.timeIds1 = setInterval(function () {
                    let loadingWidth = 398 * step.percent / 100;
                    if (loadingWidth <= 398) {
                        $('.trend').find('.loading-process .loading').width(loadingWidth);
                    }
                    else {
                        $('.trend').find('.loading-process .loading').width(398);
                    }
                }, 100);
            },
            onError(err) {
                // console.log('onError', err);
                clearInterval(window.timeIds);
                clearInterval(window.timeIds1);
                $('.trend').find('.loading-process').remove();
                if (err.status === '422' || err.status === 422) {
                    message.error(self.state.fileName + " upload failed...Can't upload file with the same name, please try again");
                    return false;
                }
                message.error(self.state.fileName + ' upload failed...please try again');
            }
        };
        let className = 'upload-button';
        if (self.props.init) {
            className = 'upload-button-o';
        }
        return (
            <Upload {...props} ref="inner">
                <Button className={className}>
                    <Icon type="plus" /> Add data
                </Button>
            </Upload>
        );
    }
}
