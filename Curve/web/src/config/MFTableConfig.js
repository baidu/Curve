/**
 * @file Table configuration: the configuration of the header,
 * the configuration of the batch operation, the configuration of the prompt box
 * @author cuiyuan
 */

const api = require('../common/api').default.api;

export const viewListConfig = {
    // Header configuration
    header: [
        {
            text: 'dataSet',
            value: 'dataSet'
        },
        {
            text: 'Data range',
            value: 'dataLength'
        },
        {
            text: 'Interval',
            value: 'dataPeriod'
        },
        {
            text: 'Anomaly percent',
            value: 'percent'
        },
        {
            text: 'access',
            value: 'read'
        },
        {
            text: 'edit',
            value: 'write'
        },
        {
            text: 'action',
            value: 'action',
            children: [
                {
                    text: 'delete',
                    value: 'delete'
                },
                {
                    text: 'export',
                    value: 'export'
                },
                {
                    text: 'view',
                    value: 'view'
                }
            ]
        }
    ],
    // Table name
    tableName: 'MFTable',
    // Batch operation configuration
    batchAction: [
        // {
        //     text: 'Batch export',
        //     value: 'export',
        //     url: api.exportData,
        //     ref: 'batchExport'
        // },
        // {
        //     text: 'Batch delete',
        //     value: 'delete',
        //     url: api.deleteData,
        //     ref: 'batchDelete'
        // }
    ],
    // Prompt box configuration
    dialog: [
        {
            dialogTitle: 'Delete',
            dialogContent: [
                ' will not be restored after the deletion, is still to be deleted?'
            ],
            dialogAction: [
                {
                    text: 'Delete',
                    value: 'confirm',
                    url: api.deleteData
                },
                {
                    text: 'cancel',
                    value: 'cancel'
                }
            ],
            dialogType: 'confirm'
        },
        {
            dialogTitle: 'Tip',
            dialogContent: [
                'Insufficient access'
            ],
            dialogAction: [
                {
                    text: 'cancel',
                    value: 'cancel'
                }
            ],
            dialogType: 'alert'
        }
    ]
};

