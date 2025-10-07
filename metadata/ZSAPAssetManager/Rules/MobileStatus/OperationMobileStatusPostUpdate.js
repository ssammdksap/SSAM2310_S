import generateGUID from '../../../SAPAssetManager/Rules/Common/guid'
import ODataDate from '../../../SAPAssetManager/Rules/Common/Date/ODataDate';
import common from '../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import OperationMobileStatusLibrary from '../../../SAPAssetManager/Rules/Operations/MobileStatus/OperationMobileStatusLibrary';
import supervisor from '../../../SAPAssetManager/Rules/Supervisor/SupervisorLibrary';
import noteWrapper from '../../../SAPAssetManager/Rules//Supervisor/MobileStatus/NoteWrapper';
import { ChecklistLibrary } from '../../../SAPAssetManager/Rules/Checklists/ChecklistLibrary';
import phaseModelEnabled from '../../../SAPAssetManager/Rules/Common/IsPhaseModelEnabled';
import libClock from '../../../SAPAssetManager/Rules/ClockInClockOut/ClockInClockOutLibrary';
import libMobile from '../../../SAPAssetManager/Rules/MobileStatus/MobileStatusLibrary';
import CompleteOperationMobileStatusAction from '../../../SAPAssetManager/Rules/Operations/MobileStatus/CompleteOperationMobileStatusAction';
import LocationUpdate from '../../../SAPAssetManager/Rules/MobileStatus/LocationUpdate';
import pdfAllowedForOperation from '../../../SAPAssetManager/Rules/PDF/IsPDFAllowedForOperation';
import mileageAddNav from '../../../SAPAssetManager/Rules/ServiceOrders/Mileage/MileageAddNav';
import expenseCreateNav from '../../../SAPAssetManager/Rules/Expense/CreateUpdate/ExpenseCreateNav';
import mobileStatusHistoryEntryCreate from '../../../SAPAssetManager/Rules/MobileStatus/MobileStatusHistoryEntryCreate';
import ExpensesVisible from '../../../SAPAssetManager/Rules/ServiceOrders/Expenses/ExpensesVisible';
import MileageIsEnabled from '../../../SAPAssetManager/Rules/ServiceOrders/Mileage/MileageIsEnabled';
import PDFGenerateDuringCompletion from '../../../SAPAssetManager/Rules/PDF/PDFGenerateDuringCompletion';
import libAutoSync from '../../../SAPAssetManager/Rules/ApplicationEvents/AutoSync/AutoSyncLibrary';
import userFeaturesLib from '../../../SAPAssetManager/Rules/UserFeatures/UserFeaturesLibrary';
import IsConfirmationEnabledOperation from '../../../SAPAssetManager/Rules/Operations/IsConfirmationEnabledOperation';
import ToolbarRefresh from '../../../SAPAssetManager/Rules/Common/DetailsPageToolbar/ToolbarRefresh';
/* Added Import of Meter Library to check the Meter is  processed or not*/
import meterLib from '../../../SAPAssetManager/Rules/Meter/Common/MeterLibrary';

function rollbackMobileStatus(context, mobileStatusEditLink, showBanner) {
    let actionObject = {
        'Name': '/SAPAssetManager/Actions/Common/GenericDiscard.action',
        'Properties': {
            'Target': {
                'EntitySet': 'PMMobileStatuses',
                'EditLink': mobileStatusEditLink,
                'Service': '/SAPAssetManager/Services/AssetManager.service',
            },
        },
    };

    if (showBanner) {
        actionObject.OnSuccess = {
            'Name': '/SAPAssetManager/Actions/CreateUpdateDelete/UpdateEntityFailureMessage.action',
            'Properties': {
                'Message': '$(L,assign_failure)',
            },
        };
    }
    return context.executeAction(actionObject).then(result => {
        try {
            return JSON.parse(result.data);
        } catch (exc) {
            return {};
        }
    });
}

function rollbackAssignment(context, assignmentEditLink) {
    return context.executeAction({
        'Name': '/SAPAssetManager/Actions/Common/GenericDiscard.action',
        'Properties': {
            'Target': {
                'EntitySet': 'WorkOrderTransfers',
                'EditLink': assignmentEditLink,
                'Service': '/SAPAssetManager/Services/AssetManager.service',
            },
        },
    }).then(result => {
        try {
            return JSON.parse(result.data);
        } catch (exc) {
            return {};
        }
    });
}

function assignToSelf(context, binding, updateResult) {
    if (binding.PersonNum === '00000000') {
        let employee = common.getPersonnelNumber();
        return context.executeAction({
            'Name': '/SAPAssetManager/Actions/MobileStatus/OperationSelfAssign.action',
            'Properties': {
                'Properties': {
                    'OperationNo': binding.OperationNo,
                    'OrderId': binding.OrderId,
                    'EmployeeTo': employee,
                },
            },
        }).then((selfAssign) => {
            selfAssign = JSON.parse(selfAssign.data);
            // Only attempt to upload Operation Transfer if device is online
            if (context.getPageProxy().nativescript.connectivityModule.getConnectionType() > 0) {
                // Upload the created WorkOrderTransfer record
                return context.executeAction('/SAPAssetManager/Actions/MobileStatus/OperationTransferUpload.action').then(() => {
                    // Check Error Archive to see if issues occurred during assignment
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'ErrorArchive', [], "$filter=RequestMethod eq 'POST' and RequestURL eq '/WorkOrderTransfers'").then(entries => {
                        if (entries.length === 0) {
                            // If no errors, re-download Operation and proceed to update toolbar
                            return context.executeAction({
                                'Name': '/SAPAssetManager/Actions/MobileStatus/OperationTransferDownload.action',
                                'Properties': {
                                    'DefiningRequests': [{
                                        'Name': 'MyWorkOrderOperations',
                                        'Query': `$filter=OrderId eq '${binding.OrderId}' and OperationNo eq '${binding.OperationNo}'`,
                                    }],
                                },
                            }).then(() => {
                                // Update PersonNum so subsequent transitions don't trigger an upload
                                binding.PersonNum = employee;
                            });
                        } else {
                            // If errors occurred trying to assign operation, roll back Overall Status and delete all related ErrorArchive entries (normally should only be one)
                            let actionPromises = [];
                            entries.forEach(entry => {
                                actionPromises.push(context.executeAction({
                                    'Name': '/SAPAssetManager/Actions/Common/ErrorArchiveDiscard.action',
                                    'Properties': {
                                        'OnSuccess': '',
                                        'OnFailure': '',
                                        'Target': {
                                            'EntitySet': 'ErrorArchive',
                                            'Service': '/SAPAssetManager/Services/AssetManager.service',
                                            'QueryOptions': `$filter=RequestID eq ${entry.RequestID}`,
                                        },
                                    },
                                }));
                            });
                            return Promise.all(actionPromises).then(() => {
                                return rollbackMobileStatus(context, updateResult['@odata.editLink'], true).then(result => {
                                    // Hack -- See MobileStatusPopover.js
                                    binding.OperationMobileStatus_Nav.MobileStatus = result.MobileStatus;
                                });
                            });
                        }
                    });
                }, () => {
                    // If upload fails due to a network issue, roll back Overall Status and Transfer
                    let promises = [];
                    promises.push(rollbackMobileStatus(context, updateResult['@odata.editLink']), true);
                    promises.push(rollbackAssignment(context, selfAssign['@odata.editLink']), true);

                    return Promise.all(promises).then(rollbackResults => {
                        // Hack -- See MobileStatusPopover.js
                        binding.OperationMobileStatus_Nav.MobileStatus = rollbackResults[0].MobileStatus;
                    });
                });
            } else {
                // "Transfer" operation so client doesn't think it's unassigned
                return context.executeAction({
                    'Name': '/SAPAssetManager/Actions/WorkOrders/Operations/WorkOrderOperationUpdateAssignment.action',
                    'Properties': {
                        'Properties': {
                            'PersonNum': employee,
                        },
                        'Headers': {
                            'Transaction.Ignore': 'true',
                        },
                    },
                });
            }
        });
    } else {
        return Promise.resolve();
    }
}

/**
* Mobile Status post-update rule
* @param {IClientAPI} context
*/
export default function OperationMobileStatusPostUpdate(context) {
    if (!context.binding && context.getActionBinding) {
        context._context.binding = context.getActionBinding();
    }
    const cicoEnabled = libClock.isCICOEnabled(context);
    const STARTED = common.getAppParam(context, 'MOBILESTATUS', context.getGlobalDefinition('/SAPAssetManager/Globals/MobileStatus/ParameterNames/StartParameterName.global').getValue());
    const HOLD = common.getAppParam(context, 'MOBILESTATUS', context.getGlobalDefinition('/SAPAssetManager/Globals/MobileStatus/ParameterNames/HoldParameterName.global').getValue());
    const COMPLETE = common.getAppParam(context, 'MOBILESTATUS', context.getGlobalDefinition('/SAPAssetManager/Globals/MobileStatus/ParameterNames/CompleteParameterName.global').getValue());
    const REVIEW = common.getAppParam(context, 'MOBILESTATUS', context.getGlobalDefinition('/SAPAssetManager/Globals/MobileStatus/ParameterNames/ReviewParameterName.global').getValue());
    const userGUID = common.getUserGuid(context);
    const userId = common.getSapUserName(context);
    const ORDERTYPEISSUE = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/ParameterNames/OrderTypeIssueParameterName.global').getValue(); // Custom OrderType issue for GAP181
    const ATTACHMENTMISSING = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/ParameterNames/AttachmentMissing.global').getValue();

    //Object Card Collection does not have a context binding
    const binding = context.binding ? context.binding : context.getActionBinding();

    return IsConfirmationEnabledOperation(context).then((isConfirmationEnabledOperationResult) => {
        const isConfirmationEnabled = isConfirmationEnabledOperationResult;

        const updateResult = (() => {
            try {
                let data = JSON.parse(context.getActionResult('MobileStatusUpdate').data);
                if (data.MobileStatus === 'D-COMPLETE') {
                    data.MobileStatus = COMPLETE;
                }
                if (data.MobileStatus === 'D-REVIEW') {
                    data.MobileStatus = REVIEW;
                }
                return data;
            } catch (exc) {
                // If no action result, assume no mobile status change (CICO) -- return existing PM Mobile Status
                return binding.OperationMobileStatus_Nav;
            }
        })();

        let UpdateCICO = function () {
            let requiresCICO = true;
            // Save timestamp for confirmation/CATS
            let odataDate = new ODataDate();
            common.setStateVariable(context, 'StatusStartDate', odataDate.date());

            // Create relevant CICO entry
            let cicoValue = '';
            switch (updateResult.MobileStatus) {
                case STARTED:
                    cicoValue = cicoEnabled ? 'CLOCK_IN' : 'START_TIME';
                    break;
                case HOLD:
                case COMPLETE:
                case REVIEW:
                    cicoValue = cicoEnabled ? 'CLOCK_OUT' : 'END_TIME';
                    break;
                default:
                    break;
            }
            if (updateResult.MobileStatus === COMPLETE) {
                requiresCICO = libClock.isBusinessObjectClockedIn(context);  //Only clock out if this object is clocked in.  Handles supervisor approving a technician's work case
            }

            if (cicoValue && requiresCICO) { //Only add to CICO if status requires
                return context.executeAction({
                    'Name': '/SAPAssetManager/Actions/ClockInClockOut/WorkOrderClockInOut.action', 'Properties': {
                        'Properties': {
                            'RecordId': generateGUID(),
                            'UserGUID': userGUID,
                            'OperationNo': binding.OperationNo,
                            'SubOperationNo': '',
                            'OrderId': binding.OrderId,
                            'PreferenceGroup': cicoValue,
                            'PreferenceName': binding.OrderId,
                            'PreferenceValue': odataDate.toDBDateTimeString(context),
                            'UserId': userId,
                        },
                        'CreateLinks': [{
                            'Property': 'WOOperation_Nav',
                            'Target':
                            {
                                'EntitySet': 'MyWorkOrderOperations',
                                'ReadLink': `MyWorkOrderOperations(OrderId='${binding.OrderId}',OperationNo='${binding.OperationNo}')`,
                            },
                        }],
                    },
                }).then(() => {
                    if ((updateResult.MobileStatus === 'HOLD' || updateResult.MobileStatus === 'COMPLETE') && isConfirmationEnabled) {
                        return OperationMobileStatusLibrary.showTimeCaptureMessage(context);
                    } else {
                        return Promise.resolve();
                    }
                });
            } else {
                if ((updateResult.MobileStatus === 'HOLD' || updateResult.MobileStatus === 'COMPLETE') && isConfirmationEnabled) {
                    return OperationMobileStatusLibrary.showTimeCaptureMessage(context);
                } else {
                    return Promise.resolve();
                }
            }
        };

        // UAT Defect 8000000450 - Remove Signature pop up for selected Order Types
        // Configured 0019 in OrderType.Blacklist Parameter in MAIF as per input from Vikas
        const signBlacklistedTypes = common.getAppParam(context, 'SIGN_CAPTURE', 'OrderType.Blacklist');
        let signBlacklistedTypesA = signBlacklistedTypes.split(",");
        if (signBlacklistedTypesA.includes(context.binding.WOHeader.OrderType)) {
            context.getPageProxy().getClientData().didShowSignControl = true;
        }

        common.setStateVariable(context, 'IgnoreToolbarUpdate', true); //Do not update toolbar 'on return' during status change
        if (updateResult.MobileStatus === COMPLETE || updateResult.MobileStatus === REVIEW) {
            return CheckDisconnectionCC(context, updateResult).then(result => { // Custom condition check for GAP181
                if (result) {
                    // CP1 
                    return CheckUtilityAttachments(context).then(result2 => { // Custom condition check for CR004 Attachments 
                        if (result2) {
                            return ChecklistLibrary.allowWorkOrderComplete(context, binding.HeaderEquipment, binding.HeaderFunctionLocation).then(results => { //Check for non-complete checklists and ask for confirmation
                                if (results === true) {
                                    return OperationMobileStatusLibrary.completeOperation(context, updateResult, () => { // May throw rejected Promise if signature required and declined
                                        return libMobile.NotificationUpdateMalfunctionEnd(context, binding);
                                    }).catch(() => {
                                        // Roll back mobile status update
                                        return Promise.reject();
                                    });
                                } else {
                                    return Promise.resolve();
                                }
                            }).then(() => {
                                return supervisor.checkReviewRequired(context, binding).then(reviewRequired => {
                                    binding.SupervisorDisallowFinal = '';
                                    if (reviewRequired) {
                                        binding.SupervisorDisallowFinal = true; //Tech cannot set final confirmation on review
                                    }
                                    return noteWrapper(context, reviewRequired).then(() => { //Allow tech to leave note for supervisor
                                        context.getClientData().ChangeStatus = updateResult.MobileStatus;
                                        if (isConfirmationEnabled) {
                                            return OperationMobileStatusLibrary.showTimeCaptureMessage(context, !reviewRequired, updateResult.MobileStatus);
                                        } else {
                                            return Promise.resolve();
                                        }
                                    });
                                });
                            }).then(() => {
                                let executeExpense = false;
                                let executeMilage = false;
                                let executePDF = false;
                                if (ExpensesVisible(context)) {
                                    executeExpense = true;
                                }
                                if (MileageIsEnabled(context)) {
                                    executeMilage = true;
                                }
                                if (pdfAllowedForOperation(context)) {
                                    executePDF = true;
                                }
                                common.setStateVariable(context, 'IsExecuteExpense', executeExpense);
                                common.setStateVariable(context, 'IsExecuteMilage', executeMilage);
                                common.setStateVariable(context, 'IsPDFGenerate', executePDF);
                                if (executeExpense) {
                                    return expenseCreateNav(context);
                                } else if (executeMilage) {
                                    return mileageAddNav(context);
                                } else {
                                    return Promise.resolve();
                                }
                            }).then(() => {
                                context.showActivityIndicator('');
                                libMobile.phaseModelStatusChange(context, updateResult.MobileStatus);
                                return UpdateCICO().then(() => {
                                    let actionArgs = {
                                        OperationId: binding.OperationNo,
                                        WorkOrderId: binding.OrderId,
                                        isOperationStatusChangeable: libMobile.isOperationStatusChangeable(context),
                                        isHeaderStatusChangeable: libMobile.isHeaderStatusChangeable(context),
                                        didCreateFinalConfirmation: common.getStateVariable(context, 'IsFinalConfirmation', common.getPageName(context)),
                                    };
                                    let action = new CompleteOperationMobileStatusAction(actionArgs);
                                    context.getClientData().confirmationArgs = {
                                        doCheckOperationComplete: false,
                                    };
                                    context.getClientData().mobileStatusAction = action;
                                    return action.execute(context).then((result) => {
                                        if (result) {
                                            LocationUpdate(context);
                                            return libClock.reloadUserTimeEntries(context).then(() => {
                                                return ToolbarRefresh(context).then(() => {

                                                    let PDFGenerationPromise = Promise.resolve();
                                                    if (updateResult.MobileStatus === COMPLETE) {
                                                        if (!(common.getStateVariable(context, 'IsPDFGenerate') &&
                                                            (common.getStateVariable(context, 'IsExecuteMilage') || common.getStateVariable(context, 'IsExecuteExpense')))) {
                                                            PDFGenerationPromise = PDFGenerateDuringCompletion(context);
                                                        }
                                                    }
                                                    return PDFGenerationPromise.then(() => {
                                                        return context.executeAction('/SAPAssetManager/Actions/WorkOrders/MobileStatus/OperationMobileStatusSuccessMessage.action').then(() => {
                                                            return libAutoSync.autoSyncOnStatusChange(context);
                                                        });
                                                    });
                                                });
                                            });
                                        }
                                        return Promise.reject();
                                    });
                                });
                            }).catch(() => {
                                context.dismissActivityIndicator();
                                // Roll back mobile status update
                                return context.executeAction('/SAPAssetManager/Rules/MobileStatus/PhaseModelStatusUpdateRollback.js');
                            }).finally(() => {
                                context.dismissActivityIndicator();
                            });
                        } else {
                            updateResult.MobileStatus = ATTACHMENTMISSING;
                            context.getClientData().ChangeStatus = updateResult.MobileStatus;
                            return context.executeAction('/SAPAssetManager/Rules/MobileStatus/PhaseModelStatusUpdateRollback.js').then(() => {
                                return UpdateToolbarCaption(context).then(() => {
                                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=WorkOrder,NotifPriority,NotifMobileStatus_Nav,NotifDocuments,NotifDocuments/Document,HeaderLongText,FunctionalLocation,Equipment,NotifMobileStatus_Nav/OverallStatusCfg_Nav").then(results => {
                                        let pageProxy = context.getPageProxy();
                                        let notificationHeaderBinding = results.getItem(0);
                                        pageProxy.setActionBinding(notificationHeaderBinding);
                                        return pageProxy.executeAction('/ZSAPAssetManager/Actions/WorkOrders/MobileStatus/OperationMobileStatusAttachmentRequired.action').then(() => {
                                            return Promise.reject();
                                        });
                                    });
                                }).catch(() => {
                                    return Promise.reject();
                                }).catch(() => {
                                    return Promise.reject();
                                });
                            });
                        }
                    }).catch(() => {
                        // Roll back mobile status update
                        return context.executeAction('/SAPAssetManager/Rules/MobileStatus/PhaseModelStatusUpdateRollback.js').then(() => {
                            return UpdateToolbarCaption(context);
                        });
                    });
                    // CP1
                } else {
                    // Roll back mobile status update and navigate to Notification details page for meter 
                    updateResult.MobileStatus = ORDERTYPEISSUE;
                    context.getClientData().ChangeStatus = updateResult.MobileStatus;
                    return context.executeAction('/SAPAssetManager/Rules/MobileStatus/PhaseModelStatusUpdateRollback.js').then(() => {
                        return UpdateToolbarCaption(context).then(() => {
                            return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=WorkOrder,NotifPriority,NotifMobileStatus_Nav,NotifDocuments,NotifDocuments/Document,HeaderLongText,FunctionalLocation,Equipment,NotifMobileStatus_Nav/OverallStatusCfg_Nav").then(results => {
                                let pageProxy = context.getPageProxy();
                                let notificationHeaderBinding = results.getItem(0);
                                pageProxy.setActionBinding(notificationHeaderBinding);
                                return pageProxy.executeAction('/ZSAPAssetManager/Actions/WorkOrders/MobileStatus/OperationMobileStatusFailureMessageCustom.action').then(() => {
                                    return Promise.reject();
                                });
                            });
                        }).catch(() => {
                            return Promise.reject();
                        }).catch(() => {
                            return Promise.reject();
                        });
                    });
                }
            }).catch(() => {
                // Roll back mobile status update
                return context.executeAction('/SAPAssetManager/Rules/MobileStatus/PhaseModelStatusUpdateRollback.js').then(() => {
                    return UpdateToolbarCaption(context);
                }).finally(() => {
                    context.dismissActivityIndicator();
                });
            });
        } else {
            context.showActivityIndicator('');
            let selfAssignPromise = Promise.resolve();
            if (phaseModelEnabled(context)) {
                selfAssignPromise = assignToSelf(context, binding, updateResult);
            }
            return selfAssignPromise.then(() => {
                LocationUpdate(context);
                libMobile.phaseModelStatusChange(context, updateResult.MobileStatus);
                return UpdateCICO().then(() => {
                    const properites = {
                        'ObjectKey': updateResult.ObjectKey,
                        'ObjectType': common.getAppParam(context, 'OBJECTTYPE', 'Operation'),
                        'MobileStatus': updateResult.MobileStatus,
                        'EffectiveTimestamp': updateResult.EffectiveTimestamp,
                        'CreateUserGUID': updateResult.CreateUserGUID,
                        'CreateUserId': updateResult.CreateUserId,
                    };
                    return mobileStatusHistoryEntryCreate(context, properites, updateResult['@odata.readLink']).then(() => {
                        if (updateResult.MobileStatus === STARTED && userFeaturesLib.isFeatureEnabled(context, context.getGlobalDefinition('/SAPAssetManager/Globals/Features/Meter.global').getValue()) && binding.WOHeader.OrderISULinks && binding.WOHeader.OrderISULinks.length > 0) {
                            let isuProcess = binding.WOHeader.OrderISULinks[0].ISUProcess;
                            // commented below code to minimize Disconnect activity popup when operation started as this was TECOing the Operation during the auto sync and can't proceed further
                            // if (isuProcess === 'DISCONNECT' || isuProcess === 'RECONNECT') {
                            //     if (isuProcess === 'RECONNECT') { 
                            //     return context.read('/SAPAssetManager/Services/AssetManager.service', binding.WOHeader.DisconnectActivity_Nav[0]['@odata.readLink'], [], '$expand=DisconnectActivityType_Nav,DisconnectActivityStatus_Nav,WOHeader_Nav/OrderMobileStatus_Nav,WOHeader_Nav/OrderISULinks').then((result) => {
                            //         if (result && result.getItem(0)) {
                            //             let actionBinding = result.getItem(0);
                            //             actionBinding.MyWorkOrderOperation = binding;
                            //             context.setActionBinding(actionBinding);
                            //             return context.executeAction('/SAPAssetManager/Actions/WorkOrders/Meter/Activity/ActivityUpdateNav.action').then((navResult) => {
                            //                 return navResult;
                            //             });
                            //         }

                            //         return Promise.resolve();
                            //     });
                            // }
                        }
                        return Promise.resolve();
                    }).then(() => {
                        return libClock.reloadUserTimeEntries(context).then(() => {
                            return ToolbarRefresh(context).then(() => {
                                return context.executeAction('/SAPAssetManager/Actions/WorkOrders/MobileStatus/OperationMobileStatusSuccessMessage.action').then(() => {
                                    return libAutoSync.autoSyncOnStatusChange(context);
                                });
                            });
                        });
                    });
                });
            }).finally(() => {
                context.dismissActivityIndicator();
            });
        }
    });
}

/**
 * Update the screen's toolbar and enable status
 * @param {*} caption 
 * @returns 
 */
function UpdateToolbarCaption(context) {

    common.removeStateVariable(context, 'IgnoreToolbarUpdate');
    return refreshToolbar(context);

}

/**
 * Check the Disconnection CC for exception PP list for GAP181
 * @param {*} caption 
 * @returns 
 */

function CheckDisconnectionCC(context, updateResult) {
    const exceptionPP = common.getAppParam(context, 'ZEXCEPTIONS', 'EnforceDisconnectByPlants');
    const excpDisconnect = common.getAppParam(context, 'ZEXCEPTIONS', 'DisconnectExceptions');
    const excpReconnect = common.getAppParam(context, 'ZEXCEPTIONS', 'ReconnectExceptions');

    const excpInpection = common.getAppParam(context, 'ZEXCEPTIONS', 'InspectionExceptions');
    const codeInspections = common.getAppParam(context, 'ZCATALOGCODES', 'Inspections');
    const excpActivation = common.getAppParam(context, 'ZEXCEPTIONS', 'ActivationExceptions');
    const excpDeactivation = common.getAppParam(context, 'ZEXCEPTIONS', 'DeactivationExceptions');
    const gasConversionCodes = common.getAppParam(context, 'ZCATALOGCODES', 'GasConversion');
    const excpGasConversion = common.getAppParam(context, 'ZEXCEPTIONS', 'GasConversionExceptions');
    const actPMActType = common.getAppParam(context, 'ZEXCEPTIONS', 'ActivationPMActType');
    const actPMActTypeWater = common.getAppParam(context, 'ZEXCEPTIONS', 'ActivationPMActTypeWater');
    const actPMActTypeGas = common.getAppParam(context, 'ZEXCEPTIONS', 'ActivationPMActTypeGas');
    const deactPMActType = common.getAppParam(context, 'ZEXCEPTIONS', 'DeactivatePMActType');
    const deactPMActTypeWater = common.getAppParam(context, 'ZEXCEPTIONS', 'DeactivatePMActTypeWat');
    const deactPMActTypeEle = common.getAppParam(context, 'ZEXCEPTIONS', 'DeactivatePMActTypeEle');
    const followupDisconnActType = context.getGlobalDefinition('/ZSAPAssetManager/Globals/Exceptions/FollowupDisconnectionType.global').getValue();
    const followupGasConvActType = context.getGlobalDefinition('/ZSAPAssetManager/Globals/Exceptions/FollowupGasConversionType.global').getValue();

    let exceptionPPArray = null;
    let inspMaintActArray = ['CFR', 'COT', 'FFR', 'FOT', 'OFR', 'OOT'];

    if (exceptionPP.length > 0) {
        exceptionPPArray = exceptionPP.split(",");
        //Check for Disconnection OrderType and PP 
        let localBinding = context.getBindingObject();
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'OrderISULinks', [], "$filter=OrderNum eq '" + context.binding.OrderId + "'&$expand=Workorder_Nav/DisconnectActivity_Nav/DisconnectObject_Nav,Installation_Nav,Device_Nav,Premise_Nav,Device_Nav/DeviceCategory_Nav/Material_Nav,Device_Nav/RegisterGroup_Nav/Division_Nav,Device_Nav/Equipment_Nav/ObjectStatus_Nav/SystemStatus_Nav,Device_Nav/GoodsMovement_Nav,Device_Nav/DeviceLocation_Nav/FuncLocation_Nav/Address/AddressCommunication,ConnectionObject_Nav/FuncLocation_Nav/Address/AddressCommunication,Device_Nav/DeviceLocation_Nav/Premise_Nav,Workorder_Nav/OrderMobileStatus_Nav,Workorder_Nav/OrderISULinks,Device_Nav/MeterReadings_Nav").then(results => {
            if (results.length > 0) {
                localBinding = results.getItem(0);
                if (results.getItem(0).ISUProcess === "DISCONNECT" && results.getItem(0).Workorder_Nav.MaintenanceActivityType !== followupDisconnActType) {
                    localBinding.DisconnectActivity_Nav = results.getItem(0).Workorder_Nav.DisconnectActivity_Nav[0];
                    localBinding.Device_Nav = results.getItem(0).Device_Nav;
                    if (meterLib.isProcessed(localBinding)) {
                        return Promise.resolve(true);
                    } else {
                        return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                            if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                                let returnActivity = false;
                                // Multiple Activities exist but no exception catalog codes 
                                for (let i = 0; i < results2.getItem(0).Activities.length; i++) {

                                    if (results2.getItem(0).Activities[i].ActivityCodeGroup === excpDisconnect) {
                                        returnActivity = true;

                                    }
                                }
                                return Promise.resolve(returnActivity);

                            } else {
                                return Promise.resolve(false);
                            }
                        });
                    }
                }
                else if (results.getItem(0).ISUProcess === "DISCONNECT" && results.getItem(0).Workorder_Nav.MaintenanceActivityType === followupDisconnActType) {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            // Defect 8000000685 - In case of FDC maintenance Activity, Exception code shouldn't be added
                            let returnActivity = results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpDisconnect) || results2.getItem(0).Activities.some(activity => activity.ActivityCode === "ZZ00");
                            return Promise.resolve(!returnActivity);

                        } else {
                            return Promise.resolve(false);
                        }
                    });
                }
                else if (results.getItem(0).ISUProcess === "RECONNECT") {
                    localBinding.DisconnectActivity_Nav = results.getItem(0).Workorder_Nav.DisconnectActivity_Nav[0];
                    localBinding.Device_Nav = results.getItem(0).Device_Nav;
                    if (meterLib.isProcessed(localBinding)) {
                        return Promise.resolve(true);
                    } else {
                        return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                            if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                                let returnActivity = false;
                                // Multiple Activities exist but no exception catalog codes 
                                for (let i = 0; i < results2.getItem(0).Activities.length; i++) {

                                    if (results2.getItem(0).Activities[i].ActivityCodeGroup === excpReconnect) {
                                        returnActivity = true;

                                    }
                                }
                                return Promise.resolve(returnActivity);

                            } else {
                                return Promise.resolve(false);
                            }
                        });
                    }
                }
                // UAT Defect fix - Pop up not coming if you add Post Disconnection Inspection Exception in Inspection & vice versa
                // User shouldn't send back Activity Code as ZZ00. It should fail Validation
                else if (results.getItem(0).ISUProcess === "READING" && results.getItem(0).Workorder_Nav.OrderType === '0017' && (results.getItem(0).Workorder_Nav.MaintenanceActivityType === "INS")) {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let returnActivity = results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup !== excpInpection) || results2.getItem(0).Activities.some(activity => activity.ActivityCode === "ZZ00");
                            return Promise.resolve(!returnActivity);
                        } else {
                            return Promise.resolve(false);
                        }
                    });

                }
                // UAT Defect fix - Pop up not coming if you add Post Disconnection Inspection Exception in Inspection & vice versa
                // User shouldn't send back Activity Code as ZZ00. It should fail Validation
                else if (results.getItem(0).ISUProcess === "READING" && results.getItem(0).Workorder_Nav.OrderType === '0017' && (results.getItem(0).Workorder_Nav.MaintenanceActivityType === "PDI")) {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let returnActivity = results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup !== codeInspections) || results2.getItem(0).Activities.some(activity => activity.ActivityCode === "ZZ00");
                            return Promise.resolve(!returnActivity);
                        } else {
                            return Promise.resolve(false);
                        }
                    });

                }
                // UAT Defect fix - Allow only Catalog Group DEVICLOC, OTHRCOM, PDISINSP, PRMTYPE, SERSTAT
                // if Maint Activity is CFR, COT, FFR, FOT, OFR, OOT
                // User shouldn't send back Activity Code as ZZ00 or Activity Code Group as EXCPINSP. It should fail Validation
                else if (results.getItem(0).ISUProcess === "READING" && results.getItem(0).Workorder_Nav.OrderType === '0017' && inspMaintActArray.includes(results.getItem(0).Workorder_Nav.MaintenanceActivityType)) {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let returnActivity = results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpInpection) || results2.getItem(0).Activities.some(activity => activity.ActivityCode === "ZZ00");
                            return Promise.resolve(!returnActivity);
                        } else {
                            return Promise.resolve(false);
                        }
                    });

                }
                // UAT Defect fix - Pop up not coming if you add Deactivation exception in activation & vice versa
                // Investigation Results - ActivationPMActTypeWater & ActivationPMActTypeGas configs do not exist in MAIF
                // User shouldn't send back Activity Code as ZZ00. It should fail Validation
                else if (results.getItem(0).ISUProcess === "READING" && results.getItem(0).Workorder_Nav.OrderType === '0019' && (results.getItem(0).Workorder_Nav.MaintenanceActivityType.substring(0, 1) === actPMActType.substring(0, 1))) {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let returnActivity = results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpDeactivation) || results2.getItem(0).Activities.some(activity => activity.ActivityCode === "ZZ00");
                            return Promise.resolve(!returnActivity);

                        } else {
                            return Promise.resolve(false);
                        }
                    });

                }
                // UAT Defect fix - Pop up not coming if you add Deactivation exception in activation & vice versa
                // Investigation Results - DeactivatePMActTypeWat & DeactivatePMActTypeEle configs do not exist in MAIF
                // User shouldn't send back Activity Code as ZZ00. It should fail Validation
                else if (results.getItem(0).ISUProcess === "READING" && results.getItem(0).Workorder_Nav.OrderType === '0019' && (results.getItem(0).Workorder_Nav.MaintenanceActivityType.substring(0, 1) === deactPMActType.substring(0, 1))) {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let returnActivity = results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpActivation) || results2.getItem(0).Activities.some(activity => activity.ActivityCode === "ZZ00");
                            return Promise.resolve(!returnActivity);

                        } else {
                            return Promise.resolve(false);
                        }
                    });

                }
                // UAT Defect (8000000387) fix
                // Gas Conversion Residential should only allow either one of COOKNUM or EXCPDGCO
                // If COOKNUM is added, EXCPDGCO is not allowed and vice versa
                else if (results.getItem(0).ISUProcess === "READING" && results.getItem(0).Workorder_Nav.OrderType === '0020') {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let excpCount = results2.getItem(0).Activities.filter(activity => activity.ActivityCodeGroup === excpGasConversion).length;
                            let actCount = results2.getItem(0).Activities.length;
                            let returnActivity = (results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpGasConversion)) && !(excpCount == actCount);
                            return Promise.resolve(!returnActivity);
                        } else {
                            return Promise.resolve(false);
                        }
                    });
                }
                // UAT Defect (8000000387) fix
                // Gas Conversion Comemrical should only allow either EXCPDGCO or other codes. Both can't be added in same notification
                // If exception is there, you shouldn't add fryer, irani, pizza oven etc
                else if (results.getItem(0).ISUProcess === "READING" && results.getItem(0).Workorder_Nav.OrderType === '0031') {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let excpCount = results2.getItem(0).Activities.filter(activity => activity.ActivityCodeGroup === excpGasConversion).length;
                            let actCount = results2.getItem(0).Activities.length;
                            let returnActivity = (results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpGasConversion)) && !(excpCount == actCount);
                            return Promise.resolve(!returnActivity);
                        } else {
                            return Promise.resolve(false);
                        }
                    });
                }
                else
                    return Promise.resolve(true);


            } else { // Exceptions based on order types
                // NCP Related Change
                if (context.binding.WOHeader.OrderType === '0030' || context.binding.WOHeader.OrderType === '0029' || context.binding.WOHeader.OrderType === '0026') {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            return Promise.resolve(true);
                        } else {
                            return Promise.resolve(false);
                        }
                    });
                }
                else if (context.binding.WOHeader.OrderType === '0020') {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let excpCount = results2.getItem(0).Activities.filter(activity => activity.ActivityCodeGroup === excpGasConversion).length;
                            let actCount = results2.getItem(0).Activities.length;
                            let returnActivity = (results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpGasConversion)) && !(excpCount == actCount);
                            return Promise.resolve(!returnActivity);
                        } else {
                            return Promise.resolve(false);
                        }
                    });
                }
                else if (context.binding.WOHeader.OrderType === '0031') {
                    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                            let excpCount = results2.getItem(0).Activities.filter(activity => activity.ActivityCodeGroup === excpGasConversion).length;
                            let actCount = results2.getItem(0).Activities.length;
                            let returnActivity = (results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === excpGasConversion)) && !(excpCount == actCount);
                            return Promise.resolve(!returnActivity);
                        } else {
                            return Promise.resolve(false);
                        }
                    });
                }

                return Promise.resolve(true);
            }
        });

    } else {
        return Promise.resolve(true);
    }
}

function CheckUtilityAttachments(context) {
    return context.read('/SAPAssetManager/Services/AssetManager.service', 'OrderISULinks', [], "$filter=OrderNum eq '" + context.binding.WOHeader.OrderId + "'&$expand=Workorder_Nav/DisconnectActivity_Nav/DisconnectObject_Nav,Installation_Nav,Device_Nav,Premise_Nav,Device_Nav/DeviceCategory_Nav/Material_Nav,Device_Nav/RegisterGroup_Nav/Division_Nav,Device_Nav/Equipment_Nav/ObjectStatus_Nav/SystemStatus_Nav,Device_Nav/GoodsMovement_Nav,Device_Nav/DeviceLocation_Nav/FuncLocation_Nav/Address/AddressCommunication,ConnectionObject_Nav/FuncLocation_Nav/Address/AddressCommunication,Device_Nav/DeviceLocation_Nav/Premise_Nav,Workorder_Nav/OrderMobileStatus_Nav,Workorder_Nav/OrderISULinks,Device_Nav/MeterReadings_Nav").then(results => {
        if (results.length > 0) {
            if (results.getItem(0).ISUProcess !== '' || results.getItem(0).ISUProcess === undefined || results.getItem(0).ISUProcess !== null || results.getItem(0).ISUProcess !== 'undefined') {
                return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderDocuments', [], "$expand=Document&$filter=sap.islocal() and OrderId eq '" + context.binding.WOHeader.OrderId + "' and (OperationNo eq null or OperationNo eq '') and Document/FileName ne null").then(results => {
                    if (results.length > 0) {
                        return Promise.resolve(true);
                    }
                    else
                        return Promise.resolve(false);

                });

            }
            else
                return Promise.resolve(true);

        }

        else
            return Promise.resolve(true);
    });
}
