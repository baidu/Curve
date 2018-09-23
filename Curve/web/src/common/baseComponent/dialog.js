/**
 * @file response
 * @author cuiyuan
 */

import './dialog.less';

import React, {Component} from 'react';
import Close from 'react-icons/lib/fa/close';
import {axiosInstance} from '../../tools/axiosInstance';
import eventProxy from '../../tools/eventProxy';
import {Link, hashHistory} from 'react-router';

export default class Dialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            options: {
                dialogType: 'alert',
                dialogContent: 'content',
                dialogShow: false,
                dialogCallback: {
                    okCallback: function () {},
                    cancelCallback: function () {}
                },
                dialogOverlayBackgroundColor: '#fff',
                dialogCallbackMessage: {
                    success: 'success',
                    error: 'error'
                }
            }
        };
        this.confirm = this.confirm.bind(this);
        this.cancel = this.cancel.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
    }

    componentDidMount() {
        eventProxy.on('beforeOpenDialog', (dialogConfig) => {
            this.setState({
                options: dialogConfig
            });
        });
        eventProxy.on('afterOpenDialog', () => {

        });
        eventProxy.on('beforeCloseDialog', () => {

        });
        eventProxy.on('afterCloseDialog', () => {

        });
    }

    confirm() {
        let params = this.state.options.dialogParams;
        let {url, name} = params;
        this.props.showLoading();
        axiosInstance.delete(url).then(response => {
            this.state.options.dialogCallback.okCallback(name);
            // close modal
            this.closeDialog();
            this.props.hideLoading();
            eventProxy.trigger('messageTip', {
                messageType: 'success',
                messageContent: this.state.options.dialogCallbackMessage.success,
                messageShow: true,
                messageDuration: 2.5
            });
        }).catch(err => {
            this.closeDialog();
            this.props.hideLoading();
            eventProxy.trigger('messageTip', {
                messageType: 'error',
                messageContent: this.state.options.dialogCallbackMessage.error,
                messageShow: true,
                messageDuration: 2.5
            });
        });
    }

    closeDialog() {
        this.state.options.dialogShow = false;
        this.setState({
            options: this.state.options
        });
    }

    cancel() {
        this.closeDialog();
    }

    render() {
        let overlayWidth = document.body.clientWidth;
        let overlayHeight = document.body.clientHeight + 50 > 660 ? document.body.clientHeight + 50 : 660;
        let dialogOverlayClassName = 'dialog-overlay ';
        if (this.state.options.dialogShow) {
            dialogOverlayClassName += 'active';
        }
        return (
            <div className={dialogOverlayClassName} style={{
                width: overlayWidth + 'px',
                height: overlayHeight + 'px',
                background: this.state.options.dialogOverlayBackgroundColor
            }}>
                <div className="dialog">
                    <div className="dialog-header">
                        <div className="dialog-title">{this.state.options.dialogTitle}</div>
                        <Close className="dialog-close"
                               onClick={this.cancel}
                        ></Close>
                    </div>
                    <div className="dialog-body">
                        <div className="dialog-content">{this.state.options.dialogContent}</div>
                        <div className="dialog-footer">
                            <button className="confirm operation-btn"
                                    style={{display: !this.state.options.dialogType || this.state.options.dialogType === 'confirm' ? 'inline-block' : 'none'}}
                                    onClick={this.confirm}
                                    ref="dialogConfirm">Delete</button>
                            <button className="cancel operation-btn"
                                    onClick={this.cancel}
                                    ref="dialogCancel">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
