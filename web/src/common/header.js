/**
 * @file viewLayout
 * @author mohaiyan
 */

import './css/header.less';

import React, {Component} from 'react';
// import {Link} from 'react-router';
// import {viewLayoutConfig} from './headerConfigExample';
import {Layout} from 'antd';
// import {axiosInstance} from 'axiosInstance';

const {Header, Content} = Layout;


export default class ViewLayout extends Component {

    constructor(props) {
        super(props);

        this.state = {

        };
    }

    componentDidMount() {
        this.getUser();
    }

    getUser() {
        // let me = this;
        // axiosInstance.get(login).then(function (response) {
        //     if (response.data.message) {
        //         return;
        //     }
        //     let resData = response.data;
        //     if (resData.username) {
        //         me.setState({
        //             username: resData.username
        //         });
        //     }
        // });
    }

    render() {
        return (
            <div className="container-skin skin-white">
                <div className="header header-white"
                    style={{height: '50px', backgroundColor: '#388ff7', padding: '0px', lineHeight: '50px'}}>
                    <div className="logo">Curve</div>
                </div>
                <div className="children-container-white">
                   {this.props.children}
                </div>
                <div className="children-container-black">
                    {this.props.children}
                </div>
            </div>
        );
    }
}
