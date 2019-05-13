/**
 * @file response
 * @author cuiyuan
 */

import '../../index/component/sidebar.less';
import '../../index/component/trend.less';
import './loading.less';
import React, {Component} from 'react';
import eventProxy from '../../tools/eventProxy';
import Upload from 'rc-upload';
import {hashHistory} from 'react-router';

const api = require('../../common/api').default.api;

export default class UploadData extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // The name of the current file
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
                let fileNames = file.name.split('.');
                let names = [];
                fileNames.forEach((item, index) => {
                    if (index < fileNames.length - 1) {
                        names.push(item);
                    }
                });
                self.setState({
                    fileName: names.join('.')
                });
            },
            onStart(file) {
                // console.log('onStart', file.name);
                // this.refs.inner.abort(file);
                // Display mask
                self.props.showUploading();
            },
            onSuccess(result, file) {
                // console.log('onSuccess', file);
                // Hidden mask
                self.props.hideUploading();
                // Update sidebar data
                self.props.updateList(result.data, callback);
                let callback = function () {};
                if (self.props.type === 'list') {

                }
                else if (self.props.type === 'trend') {
                    let url = '/home/' + result.data.name;
                    hashHistory.push(url);
                }
            },
            onProgress(step, file, result) {
                // Update progress bar
                self.props.uploadingProcess(step.percent);
            },
            onError(err) {
                // console.log('onError', err);
                if (err.status === '422' || err.status === 422) {
                    eventProxy.trigger('messageTip', {
                        messageType: 'error',
                        messageContent: self.state.fileName + " upload failed...Can't upload file with the same name, please try again",
                        messageShow: true,
                        messageDuration: 2.5
                    });
                    // Hidden mask
                    self.props.hideUploading();
                    return false;
                }
            }
        };
        let className = 'upload-button';
        return (
            <Upload {...props} ref="inner">
                <button className={className}>
                    + Add data
                </button>
            </Upload>
        );
    }
}
