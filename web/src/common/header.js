/**
 * @file viewLayout
 * @author mohaiyan
 */

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
            foldMenu: 'block'
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
        <Layout>
            <Header className="header"
                style= {{height: '50px', backgroundColor: '#388ff7', padding: '0px', lineHeight: '50px'}}>
                <div className="logo">Curve</div>
            </Header>
            <Layout>
                <Layout>
                    <Content style={{background: '#fff', padding: 0, margin: 0, minHeight: 580}}>
                       {this.props.children}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
        );
    }
}
