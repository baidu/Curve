/**
 * @file MFTable multifunction table component
 * @author cuiyuan
 */

import './MFTable.less';
import './sidebar.less';

import React, {Component} from 'react';
import moment from 'moment';
import {Link, hashHistory} from 'react-router';
import {axiosInstance} from '../../tools/axiosInstance';
import {viewListConfig} from '../../config/MFTableConfig';
import eventProxy from '../../tools/eventProxy';
import {Layout, Icon} from 'antd';
import Sidebar from './sidebar';

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

const {Sider, Content} = Layout;
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

export default class MFTable extends Component {
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
            // Data list
            list: [],
            // In the load data, true: indicates that the load is being loaded, false: the load completion
            loading: true,
            // Mask layer display, true: display display; false: represent hidden
            overlay: false,
            // The value of the width of each column
            width,
            // Default operation Icon
            actionIconList: actionIconMap,
            // Default batch operation
            refActive: false,
            // Default full selection
            selectAllChecked: false,
            // The check box for each line is unchecked by default
            listChecked: [],
            // The prompt box is not displayed by default
            dialogDisplay: {
                confirm: false,
                alert: false
            },
            // Current operation data
            currentItem: {},
            // A collection of data names involved in the operation
            nameList: [],
            // The width of body
            windowWidth: 'auto',
            name: '',
            data: [],
            menuDisplay: 'block',
            foldMenu: 'block',
            unFoldMenu: 'none',
            sideList: [],
            overlayDisplay: 'none',
            dialogTitle: '',
            dialogContent: '',
            // Customize bullet content
            dialogContentCustom: ''
        };
        // Delete operations, including single deletions and batch operations
        this.delete = this.delete.bind(this);
        // Export operations, including single export and batch export
        this.export = this.export.bind(this);
        // Switch check box operation
        this.toggle = this.toggle.bind(this);
        // Closing the prompt box operation
        this.close = this.close.bind(this);
        // Search operation
        this.search = this.search.bind(this);
        // Batch operation, obtained by listConfig.batch configuration
        this.batchAction = this.batchAction.bind(this);
        // The prompt box operation is configured through the listConfig.dialog configuration
        this.dialogAction = this.dialogAction.bind(this);
        // Setting the width of the table
        this.setWindowWidth = this.setWindowWidth.bind(this);
        // Set permissions
        this.permissions = this.permissions.bind(this);
    }

    componentDidMount() {
        // Update the width of the current window
        this.setWindowWidth();
        // Get a list of list data
        this.getBodyData();
        // Bind the resize event: recalculate the width of the list per item
        window.addEventListener('resize', this.setWindowWidth);
        eventProxy.on('loadTrend', obj => {
            if (typeof obj.list === 'string') {
                return;
            }
            this.setState({
                sideList: obj.list
            });
        });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.setWindowWidth);
        this.setState = (state,callback)=>{
            return;
        };
    }

    /**
     * Update the width of the current window
     *
     */
    setWindowWidth() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.lazySetContainerWidth();
        }, 500);
    }

    /**
     * Throttling to prevent repeated calculation of the width of container
     *
     */
    lazySetContainerWidth() {
        // Get the total width of the current table
        // Calculates the width of the other columns except the check box and operation columns.
        // The total width of the table - the width of the operation column - the width of the check box - the padding width on both sides of the check box.
        if (this.refs.list) {
            let containerWidth = this.refs.list.offsetWidth - ACTION_ITEM_WIDTH - CHECKBOX_WIDTH - 2 * PADDING_WIDTH;
            this.setState({
                windowWidth: containerWidth
            }, () => {
                this.refreshCellWidth();
            });
        }
    }

    /**
     * Search boxes are searched, and search results are returned
     *
     * @param  {Object}  e [Event object, input input box]
     */
    search(e) {
        // Return to the search, other keys do not search
        if (e.which !== 13 && e.keyCode !== 13) {
            return;
        }
        this.setState({
            loading: true
        });
        let url = api.getDataList + '?pattern=' + encodeURIComponent(this.refs.searchBox.value);
        axiosInstance.get(url).then(response => {
            const data = response.data;
            this.setState({
                list: data.data,
                loading: false
            });
        });
    }

    /**
     * The operation of the prompt box footer
     *
     * @param  {Object}  item    [Current prompt box configuration object]
     */
    dialogAction(item) {
        let name = typeof this.state.nameList === 'array' ? this.state.nameList.join(',') : '';
        let url = item.url || '';
        let value = item.value;
        if (value === 'confirm') {
            url = url + encodeURIComponent(name);
            axiosInstance.delete(url).then(response => {
                const data = response.data;
                let listData = this.state.list.filter(item => {
                    return item.name !== name;
                });
                this.setState({
                    list: listData,
                    overlay: false,
                    dialogDisplay: {
                        confirm: false,
                        alert: false
                    }
                });
            });
        }
        else if (value === 'cancel') {
            this.close();
        }
    }

    /**
     * Close the prompt box
     *
     */
    close() {
        this.setState({
            overlay: false,
            dialogDisplay: {
                confirm: false,
                alert: false
            }
        });
    }

    /**
     * Obtaining data data
     *
     */
    getBodyData() {
        let url = api.getDataList;
        axiosInstance.get(url).then(response => {
            const data = response.data;
            if (data.msg === 'redirect' && data.data.length) {
                hashHistory.push(data.data);
                return;
            }
            let listChecked = data.data.map(item => false);
            this.setState({
                list: data.data,
                loading: false,
                listChecked
            }, () => {
                this.refreshCellWidth();
                this.setState({

                });
            });
        });
    }

    /**
     * Update the width of each column
     *
     */
    refreshCellWidth() {
        let list = this.refs.list;
        let dataLine = list.getElementsByClassName('data-line');
        let width = {};
        [...dataLine].forEach(item => {
            let cell = item.getElementsByClassName('list-item');
            [...cell].forEach((cellItem, cellIndex) => {
                if (!width[cellIndex + 1]) {
                    width[cellIndex + 1] = [];
                }
                width[cellIndex + 1].push(cell[cellIndex].offsetWidth);
            });
        });
        // The sum of pixels of the widest cell per row
        let sum = 0;
        // Get the width of each column
        let maxWidth = [];
        // Get the width of each row for each row of the width of the cell
        for (let index in width) {
            let maxCellWidth = Math.max(...width[index]);
            maxWidth.push(maxCellWidth);
            sum += maxCellWidth;
        }
        let finalWidth = [];
        let containerWidth = this.state.windowWidth;
        // Calculate the maximum value of each column
        for (let i = 0; i < maxWidth.length; i++) {
            finalWidth.push(maxWidth[i] / sum * containerWidth);
        }
        this.setState({
            width: finalWidth
        });
    }

    /**
     * The header of the rendering table
     *
     * @return {Object}       [react对象]
     */
    renderHeader() {
        let checked = this.state.selectAllChecked;
        let className = checked ? 'input-label checked' : 'input-label';
        return (
            <div className="data-line head-line">
                <div className="check-box">
                    <label className={className}>
                        <input type="checkbox"
                               ref="selectAll"
                               checked={checked}
                               onChange={e => this.toggle(e, 'selectAll')}
                        />
                    </label>
                </div>
                {this.renderHeaderItem()}
            </div>
        );
    }

    /**
     * The minimum width of each column is obtained,
     * that is, the width of all the tables is more than the head hour, and the width of the header is accurate.
     *
     */
    getCellMinWidth() {
        let width = this.state.width;
        if (this.minWidth && this.minWidth.length) {
            this.lock = true;
        }
        if (width.length && !this.lock) {
            this.minWidth = [...width].map(item => {
                return item.offsetWidth;
            });
        }
    }

    /**
     * A cell to render the header of a table
     *
     * @return {Object}        [react object]
     */
    renderHeaderItem() {
        let percent = this.state.width;
        this.getCellMinWidth();
        return header.map((item, index) => {
            let width = percent && percent[index]
                ? percent[index] === 'auto' ? 'auto' : percent[index] - 2 * PADDING_WIDTH + 'px' : 'auto';
            let currentMinWidth = this.minWidth && this.minWidth[index] ? this.minWidth[index] + 'px' : 'auto';
            let className = 'head-item';
            if (index < header.length - 1) {
                className += ' ';
                className += 'list-item';
            }
            return (
                <div key={index}
                     className={className}
                     style={{
                         width: width,
                         minWidth: currentMinWidth
                     }}
                >
                    {item.text}
                </div>
            );
        });
    }

    /**
     * Determine whether checkbox is selected
     *
     * @param  {Object}  e    [Event object, input check box]
     * @param  {string}  type [Total operation check box or one check box,
     * type:selectAll said, select or choose not all, type is empty, that the current checkbox is selected]
     * @param  {string}  name [Data name for the current operation]
     */
    toggle(e, type, name) {
        if (type === 'selectAll') {
            this.toggleCheckboxAndBatchBtn(type);
        }
        else {
            this.toggleCheckboxAndBatchBtn(type, name);
        }
    }

    /**
     * Switch the state of the check box and batch operation button
     *
     * @param  {string}  type [Total operation check box or one check box,
     * type:selectAll said, select or choose not all, type is empty, that the current checkbox is selected]
     * @param  {string}  name [Data name for the current operation]
     */
    toggleCheckboxAndBatchBtn(type, name) {
        let status = this.getCheckboxAndBatchBtnStatus(type, name);
        let {listChecked, selectAllChecked, refActive} = status;
        this.setState({
            listChecked,
            selectAllChecked,
            refActive
        });
    }

    /**
     * Get the state of the check box and the batch operation button
     *
     * @param  {string}  type    [Total operation check box or one check box,
     * type:selectAll said, select or choose not all, type is empty, that the current checkbox is selected]
     * @param  {string}  name    [Data name for the current operation]
     * @return {Object}          [List component state value]
     */
    getCheckboxAndBatchBtnStatus(type, name) {
        let listChecked = this.state.listChecked;
        let refActive = false;
        let list = this.state.list;
        let selectAllChecked = !this.state.selectAllChecked;
        if (type === 'selectAll') {
            // Set each line to be selected
            listChecked = [];
            list.forEach(() => {
                listChecked.push(selectAllChecked);
            });
            // Set the batch operation button to be clickable
            refActive = selectAllChecked;
        }
        else {
            // Set each line to be selected
            list.forEach((item, index) => {
                if (!listChecked[index]) {
                    listChecked[index] = false;
                }
                if (item.name === name) {
                    listChecked[index] = !listChecked[index];
                }
            });
            // Set the batch operation button to be clickable
            // If there is a selected item, the batch button can be clicked, refActive is set to true, or otherwise false;
            // If selectFlag is true, that each data are selected, select the box is selected, selectAllChecked is set to true;
            // If selectFlag is false, it shows that a number of data are not selected, so selectAllChecked is set to false
            let checkedList = listChecked.filter(item => {
                return item;
            });
            if (checkedList.length === listChecked.length) {
                selectAllChecked = true;
            }
            else {
                selectAllChecked = false;
            }
            // Set the batch operation button to be clickable
            refActive = checkedList.length ? true : false;
        }
        return {
            refActive,
            listChecked,
            selectAllChecked
        };
    }

    /**
     * Rendering table body
     *
     * @return {Object}       [react object]
     */
    renderBody() {
        // The return result of list is empty, showing "no results" and enhancing the user experience.
        // The return result of list is not empty, and the corresponding data items are displayed
        if (!this.state.list.length) {
            return (
                <div className="no-data">No data</div>
            );
        }
        else {
            let actionIconList = this.state.actionIconList;
            let exportUrl = api.exportData;
            return this.state.list.map((item, index) => {
                let checked = this.state.listChecked[index];
                let className = checked ? 'input-label checked' : 'input-label';
                let viewUrl = '/home/' + item.name;
                return (
                    <div className="data-line body-line" key={index}>
                        <div className="check-box">
                            <label className={className}>
                                <input type="checkbox"
                                       onChange={(e, type, name) => this.toggle(e, '', item.name)}
                                       value={item.name}
                                       checked={checked}
                                />
                            </label>
                        </div>
                        {this.renderBodyItem(item, index)}
                        <div className="action-list">
                            <Link to={viewUrl}>
                                <Eye
                                     className="action"
                                     style={{display: actionIconList['view'] ? 'inline-block' : 'none'}}
                                />
                            </Link>
                            <Download onClick={(url, name) => this.export(exportUrl, item.name)}
                                      className="action"
                                      style={{display: actionIconList['export'] ? 'inline-block' : 'none'}}
                            />
                            <Trash onClick={name => this.delete(item, 'confirm')}
                                   className="action"
                                   style={{display: actionIconList['delete'] ? 'inline-block' : 'none'}}
                            />
                        </div>
                    </div>
                );
            });
        }
    }

    /**
     * The cell in the table that is rendered on the table
     *
     * @param  {Object} item    [data object]
     * @return {Object}         [react object]
     */
    renderBodyItem(item, index) {
        let width = this.state.width;
        let itemList = item;
        let text = [];
        text.push(itemList.name);
        text.push(moment(itemList.time.start).format('YYYY-MM-DD HH:mm:ss') + ' ~ ' + moment(itemList.time.end).format('YYYY-MM-DD HH:mm:ss'));
        text.push(itemList.period.length);
        text.push(itemList.labelRatio * 100 + '%');
        itemList.read = item.public_read ? true : false;
        itemList.write = item.public_edit ? true : false;
        return width.map((widthItem, index) => {
            let itemWidth;
            if (widthItem === 'auto') {
                itemWidth = 'auto';
            }
            else {
                itemWidth = width[index] - 2 * PADDING_WIDTH + 'px';
            }
            if (index === 4 || index === 5) {
                let value = index === 4 ? 'read' : 'write';
                let checked = itemList[value];
                let className = checked ? 'input-label checked' : 'input-label';
                let itemName = text[0];
                return (
                    <div className="list-item"
                         key={index}
                         style={{width: itemWidth}}
                    >
                        <div className="check-box">
                            <label className={className}>
                                <input type="checkbox"
                                       onChange={(type, name, isChecked, dialogType, currentItem) => this.permissions(value, itemName, !checked, 'alert', item)}
                                       value={value}
                                       checked={checked}
                                />
                            </label>
                        </div>
                    </div>
                );
            }
            else {
                return (
                    <div className="list-item"
                         key={index}
                         style={{width: itemWidth}}
                    >
                        {text[index]}
                    </div>
                );
            }
        });
    }

    /**
     *
     * @param {string}   type       [Read type or write type]
     * @param {string}   name       [Current data name]
     * @param {boolean}  checked    [checked or no checked]
     * @param {string}  dialogType    [type of dialog:confirm or alert]
     * @param {object}  currentItem    [current data item object]
     */
    permissions(type, name, checked, dialogType, currentItem) {
        let list = this.state.list;
        let publicEdit = false;
        let publicRead = false;
        let nameList = [currentItem.name];
        let title = this.getDialogTitle(dialogType);
        if (type === 'write') {
            list.forEach(item => {
                if (item.name === name) {
                    if (!item.public_edit && !item.public_read) {
                        item.public_edit = true;
                        item.public_read = true;
                    }
                    else if (!item.public_edit && item.public_read) {
                        item.public_edit = true;
                        item.public_read = true;
                    }
                    else if (item.public_edit && item.public_read) {
                        item.public_edit = false;
                        item.public_read = true;
                    }
                    publicEdit = item.public_edit;
                    publicRead = item.public_read;
                }
            });
        }
        else {
            list.forEach(item => {
                if (item.name === name) {
                    if (!item.public_edit && !item.public_read) {
                        item.public_edit = false;
                        item.public_read = true;
                    }
                    else if (!item.public_edit && item.public_read) {
                        item.public_edit = false;
                        item.public_read = false;
                    }
                    else if (item.public_edit && item.public_read) {
                        item.public_edit = false;
                        item.public_read = false;
                    }
                    publicEdit = item.public_edit;
                    publicRead = item.public_read;
                }
            });
        }
        let url = api.permissions + name + '/privilege?public_read=' + publicRead + '&public_edit=' + publicEdit;
        axiosInstance.put(url).then(response => {
            const data = response.data;
            if (data.msg === 'OK') {
                this.setState({
                    list
                });
            }
            else {
                this.setDialogDisplay(dialogType, title, nameList, currentItem);
            }
        }).catch(error => {
            let response = error.response;
            this.setDialogDisplay('alert', 'Error Tip', '', undefined, response.msg);
        });
    }

    /**
     * Get the title of the prompt box for the current display
     *
     * @param  {string}   type       [View the type of the prompt box]
     * @return {string}   title      [The title of the current prompt box]
     */
    getDialogTitle(type) {
        let title;
        for (let i = 0; i < dialog.length; i ++) {
            let dialogTmp = dialog[i];
            if (dialogTmp.dialogType === type) {
                title = dialogTmp.dialogTitle;
            }
        }
        return title;
    }

    /**
     * Set up the display of the current prompt, including the title title, the footer operation, the content content
     *
     * @param  {string}  type                   [The prompt box type, type is confirm: a prompt with a confirmation function; type is alert: a common view of the function]
     * @param  {string}  title                  [Prompt box title]
     * @param  {string}  nameList               [The list of data names for the current operation]
     * @param  {Object}  currentItem            [Current data object]
     * @param  {string}  dialogContentCustom    [Customize bullet content]
     */
    setDialogDisplay(type, title, nameList, currentItem, dialogContentCustom) {
        let dialogDisplay = {
            confirm: type === 'confirm',
            alert: type === 'alert'
        };
        this.setState({
            title,
            nameList,
            overlay: true,
            currentItem,
            dialogDisplay,
            dialogContentCustom
        });
    }

    /**
     * Delete the current data
     *
     * @param  {Object}  currentItem    [Current data object]
     * @param  {string}  type           [Prompt box type]
     */
    delete(currentItem, type) {
        let nameList = [currentItem.name];
        let title = this.getDialogTitle(type);
        this.setDialogDisplay(type, title, nameList, currentItem);
    }

    /**
     * Render dialog box content
     *
     * @param  {Object}  item      [Current data objects]
     * @param  {string}  dialogId  [Prompt box ID]
     * @return {Object}            [react object]
     */
    renderContent(item, dialogId) {
        if (this.state.overlay) {
            let name = typeof this.state.nameList === 'array' ? this.state.nameList.join(',') : '';
            if (item.dialogType === 'confirm' && this.state.dialogDisplay.confirm) {
                return item.dialogContent.map((currentContent, index) => {
                    let className = 'name-list' + ' ' + dialogId + index;
                    return (
                        <div className="dialog-container" key={index}>
                            <div className={className}>{name}</div>
                            {currentContent}
                        </div>
                    );
                });
            }
            else if (item.dialogType === 'alert' && this.state.dialogDisplay.alert) {
                // let currentItem = this.state.currentItem;
                if (this.state.dialogContentCustom.length) {
                    return (
                        <div className="dialog-container">
                            {this.state.dialogContentCustom}
                        </div>
                    );
                }
                else {
                    return item.dialogContent.map((currentContent, index) => {
                        return (
                            <div className="dialog-container" key={index}>
                                {currentContent}
                            </div>
                        );
                    });
                }
            }
        }
    }

    /**
     * Export operation
     *
     * @param  {string}  url       [The path URL of the exported data]
     * @param  {string}  nameList  [The set of exported data names]
     */
    export(url, nameList) {
        window.location.href = url + nameList;
    }

    /**
     * Get the set of selected data names
     *
     * @return {Array}         [Array of selected names]
     */
    getNameList() {
        let list = this.state.list;
        return list.filter((item, index) => {
            return this.state.listChecked[index];
        }).map(item => item.name);
    }

    /**
     * Render prompt box
     *
     * @return {Object}         [react object]
     */
    renderDialog() {
        return dialog.map((item, index) => {
            let {dialogTitle, dialogAction, dialogContent, dialogType} = item;
            let dialogId = 'dialog' + index;
            let dialogDisplay = this.state.dialogDisplay;
            return (
                <div className={dialogDisplay[dialogType] ? 'dialog show' : 'dialog'}
                     key={index}
                     ref={dialogId}
                >
                    <div className="dialog-head">
                        <div>{dialogTitle}</div>
                        <Close className="close" onClick={this.close} />
                    </div>
                    <div className="dialog-body">
                        <div className="dialog-content">
                            {this.renderContent(item, dialogId)}
                        </div>
                        <div className="dialog-footer">
                            {this.renderDialogFooter(dialogAction)}
                        </div>
                    </div>
                </div>
            );
        });
    }

    /**
     * Footer of the render prompt box
     *
     * @param  {Array}   action  [Operation list configuration]
     * @return {Object}          [react object]
     */
    renderDialogFooter(action) {
        return action.map((item, index) => {
            let className = 'operation-btn ' + item.value;
            return (
                <button className={className}
                        key={index}
                        onClick={currentItem => this.dialogAction(item)}
                >
                    {item.text}
                </button>
            );
        });
    }

    /**
     * Rendering batch operation buttons
     *
     * @return {Object}          [react object]
     */
    renderBatchAction() {
        return (
            <div className="operation">
                {this.renderBatchActionItem()}
            </div>
        );
    }

    /**
     * Each button to render the batch operation
     *
     * @return {Object}         [react object]
     */
    renderBatchActionItem() {
        // Configuration of batch processing using MFTableConfig
        return batchAction.map((item, index) => {
            let ref = item.ref;
            let refActive = this.state.refActive;
            let className = refActive ? 'active' : '';
            className += ' batch-operation-btn';
            return (
                <button ref={ref}
                        className={className}
                        key={index}
                        onClick={(text, value, url) => this.batchAction(item)}
                >
                    {item.text}
                </button>
            );
        });
    }

    /**
     * Batch operation
     *
     * @param  {Object}  item    [Current batch operation button]
     */
    batchAction(item) {
        let {url, text, value} = item;
        let nameList = this.getNameList();
        if (value === 'export') {
            this.export(url, nameList.join(','));
        }
        else if (value === 'delete') {
            this.setState({
                text,
                overlay: true,
                nameList,
                dialogDisplay: {
                    confirm: true,
                    alert: false
                }
            });
        }
    }

    /**
     * Rendering summary
     * @param {string} name  [Data name]
     * @param {array} list   [Data list]
     */
    returnSummary(name, list) {
        this.setState({
            name,
            sideList: list
        });
    }

    /**
     * Switch side sidebar
     * @param {string} type  [sidebar type]
     */
    toggleMenu(type) {
        if (type === 'fold') {
            this.setState({
                menuDisplay: 'none',
                foldMenu: 'none',
                unFoldMenu: 'block'
            });
        }
        else if (type === 'unfold') {
            this.setState({
                menuDisplay: 'block',
                foldMenu: 'block',
                unFoldMenu: 'none'
            });
        }
        eventProxy.trigger('loadingTip', 'Redrawing graphics, please wait');
    }

    /**
     * close summary
     */
    hideSummary() {
        eventProxy.trigger('hideSummary', this.refs.overlay);
        this.refs.overlay.style.display = 'none';
    }

    /**
     * show overlayer
     * @param {boolean} show  [Does it show]
     */
    returnShowOverlay(show) {
        if (this.state.overlayDisplay !== show) {
            this.setState({
                overlayDisplay: show ? 'block' : 'none'
            });
        }
    }

    render() {
        let params = {
            name: 'test0',
            list: this.state.list,
            menuDisplay: this.state.menuDisplay
        } || {};
        return (
            <Layout>
                <Sider className="index-sidebar"
                       style={{display: this.state.menuDisplay, position: 'static'}}
                >
                    <Sidebar
                            returnSummary={(name, list) => this.returnSummary(name, list)}
                            hideSummary={this.state.hideSummary}
                            returnShowOverlay={show => this.returnShowOverlay(show)}
                             params={params}
                             overlay={this.refs.overlay}
                             list={this.state.list}
                             type={this.state.type}
                             ref="sidebar"
                            showAll={false}
                    >
                    </Sidebar>
                </Sider>
                <Icon type="menu-fold"
                      className="menu-fold"
                      onClick={this.toggleMenu.bind(this, 'fold')}
                      style={{display: this.state.foldMenu}}
                />
                <Icon type="menu-unfold"
                      className="menu-unfold"
                      onClick={this.toggleMenu.bind(this, 'unfold')}
                      style={{display: this.state.unFoldMenu}}
                />
                <Content className="index-con">
                    <div>
                        <div className="mftable-list">
                            <div ref="list">
                                <div className="operation-box clearfix">
                                    <div className="search-box">
                                        <input type="text"
                                               className="search-input"
                                               onKeyUp={e => this.search(e)}
                                               ref="searchBox"
                                        />
                                        <SearchIcon className="search-icon" />
                                    </div>
                                    {this.renderBatchAction()}
                                </div>
                                <div className="head" ref="head">
                                    {this.renderHeader()}
                                </div>
                                <div className="body" ref="body">
                                    {this.renderBody()}
                                </div>
                                <div className={this.state.loading ? 'loading show' : 'loading'}></div>
                                <div className={this.state.loading ? 'loading-container show' : 'loading-container'}></div>
                            </div>
                            <div className={this.state.overlay ? 'overlay show' : 'overlay'}
                                 ref="overlay"
                            ></div>
                            {this.renderDialog()}
                        </div>
                    </div>
                </Content>
            </Layout>
        );
    }
}