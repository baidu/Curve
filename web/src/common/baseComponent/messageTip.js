/**
 * @file response
 * @author cuiyuan
 */

import './messageTip.less';

import React, {Component} from 'react';
import {axiosInstance} from '../../tools/axiosInstance';
import eventProxy from '../../tools/eventProxy';

export default class MessageTip extends Component {
    constructor(props) {
        super(props);
        this.state = {
            options: {
                messageContent: '',
                messageType: 'success',
                messageDuration: 2,
                messageCallback: function () {}
            }
        };
    }

    componentDidMount() {
        eventProxy.on('messageTip', (messageConfig) => {
            this.setState({
                options: messageConfig
            }, () => {
                setTimeout(() => {
                    this.state.options.messageShow = false;
                    this.state.options.messageCallback(this.state.options);
                    this.setState({
                        options: this.state.options
                    });
                }, this.state.options.messageDuration * 1000);
            });
        });
    }

    render() {
        let messageTipClassName = 'message-tip ';
        if (this.state.options.messageType) {
            messageTipClassName += ' ';
            messageTipClassName += this.state.options.messageType;
        }
        if (this.state.options.messageShow) {
            messageTipClassName += ' ';
            messageTipClassName += 'active';
        }
        return (
            <div className={messageTipClassName}>{this.state.options.messageContent}</div>
        );
    }
}
