/**
 * @file Apply the entry file to register the route
 *
 * @author yuyouwen
 */

import React, {Component} from 'react';
import ViewLayout from './common/header';
import {Router, Route, hashHistory, IndexRoute} from 'react-router';
import {routeConfig} from './config/common/routeConfig';
import './App.less';


const NotFound = () => (
    <div>
        <div className="not-found">404</div>
        <div className="not-found-text">Not found~</div>
    </div>
);



const creatRoute = routeConfig.map((item, i) => {
    if (i === 0) {
        return (
            <div key={i} >
                <IndexRoute component={item.path} />
                <Route path={item.name} component={item.path} key={i} />
            </div>
        );
    }
    return <Route path={item.name} component={item.path} key={i} />;
});



export default class App extends Component {
    render() {
        return (
            <Router history={hashHistory} >
                <Route path="/" component={ViewLayout}>
                    {creatRoute}
                    <Route path="*" component={NotFound}/>
                </Route>
            </Router>
        );
    }
}

