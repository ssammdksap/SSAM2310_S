import ComLib from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import valLib from '../../../../SAPAssetManager/Rules/Common/Library/ValidationLibrary';
import Logger from '../../../../SAPAssetManager/Rules/Log/Logger';
import NotificationUpdateSuccess from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/NotificationUpdateSuccess';
import IsPhaseModelEnabled from '../../../../SAPAssetManager/Rules/Common/IsPhaseModelEnabled';
import GetPlanningPlant from '../../../../SAPAssetManager/Rules/Common/GetPlanningPlant';
import GenerateNotificationID from '../../../../SAPAssetManager/Rules/Notifications/GenerateNotificationID';
import NotificationLibrary from '../NotificationLibrary';
import BreakdownSwitchValue from '../../../../SAPAssetManager/Rules/Notifications/BreakdownSwitchValue';
import NotificationCreateUpdateQMCodeGroupValue from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/NotificationCreateUpdateQMCodeGroupValue';
import NotificationCreateUpdateQMCodeValue from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/NotificationCreateUpdateQMCodeValue';
import NotificationCreateUpdateQMCatalog from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/NotificationCreateUpdateQMCatalog';
import NotificationCreateSuccess from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/NotificationCreateSuccess';
import GetMalfunctionStartDate from '../../../../SAPAssetManager/Rules/Notifications/MalfunctionStartDate';
import GetMalfunctionStartTime from '../../../../SAPAssetManager/Rules/Notifications/MalfunctionStartTime';
import GetMalfunctionEndDate from '../../../../SAPAssetManager/Rules/Notifications/MalfunctionEndDate';
import GetMalfunctionEndTime from '../../../../SAPAssetManager/Rules/Notifications/MalfunctionEndTime';
import GetCurrentDate from '../../../../SAPAssetManager/Rules/Confirmations/BlankFinal/GetCurrentDate';
import NotificationReferenceNumber from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/NotificationReferenceNumber';
import NotificationReferenceType from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/NotificationReferenceType';
import libVal from '../../../../SAPAssetManager/Rules/Common/Library/ValidationLibrary';
import IsEmergencyWorkEnabled from '../../../../SAPAssetManager/Rules/WorkOrders/IsEmergencyWorkEnabled';
import { isControlPopulated } from '../../../../SAPAssetManager/Rules/Notifications/CreateUpdate/RequiredFields';
import ZNotificationCreateSuccess from './NotificationCreateSuccess';

export default function NotificationCreateUpdateOnCommit(clientAPI) {

    //Temporary Workaround for an issue where the hierarchy list picker is wiping out the binding on the page. MDK issue logged MDKBUG-585.
    //Get the binding from the formcellcontainer

    let formCellContainer = clientAPI.getControl('FormCellContainer');
    if (libVal.evalIsEmpty(clientAPI.binding)) {
        clientAPI._context.binding = formCellContainer.binding;
    }

    // Prevent double-pressing done button
    clientAPI.showActivityIndicator('');

    //Determine if we are on edit vs. create
    let onCreate = ComLib.IsOnCreate(clientAPI);
    let type = ComLib.getListPickerValue(clientAPI.getControls()[0].getControl('TypeLstPkr').getValue());
    ComLib.setStateVariable(clientAPI, 'NotificationType', type); // Saving type to later use for EAMOverallStatusConfigs
    let descr = clientAPI.getControls()[0].getControl('NotificationDescription').getValue();
    let plannerGroup = clientAPI.getControls()[0].getControl('PlannerGroupListPicker').getValue();
    let breakdownStart = ComLib.getControlProxy(clientAPI, 'BreakdownStartSwitch').getValue();
    let breakdownEnd = ComLib.getControlProxy(clientAPI, 'BreakdownEndSwitch').getValue();
    let notifCategoryPromise = NotificationLibrary.getNotificationCategory(clientAPI, type).then(notifCategory => {
        ComLib.setStateVariable(clientAPI, 'NotificationCategory', notifCategory);
        return notifCategory;
    });

    if (onCreate) {
        // If we're creating a Notification, we will always be doing a ChangeSet
        ComLib.setStateVariable(clientAPI, 'ObjectCreatedName', 'Notification');
        if (!valLib.evalIsEmpty(type) && !valLib.evalIsEmpty(descr)) {
            let promises = [];
            promises.push(GenerateNotificationID(clientAPI));
            promises.push(NotificationLibrary.NotificationCreateMainWorkCenter(clientAPI));
            promises.push(NotificationCreateUpdateQMCatalog(clientAPI));

            promises.push(notifCategoryPromise);
            promises.push(NotificationLibrary.NotificationCreateUpdateFunctionalLocationLstPkrValue(clientAPI));
            promises.push(NotificationLibrary.NotificationCreateUpdateEquipmentLstPkrValue(clientAPI));
            //Sewa - Custom Code
            promises.push(NotificationLibrary.ZNotificationCreateUpdateFunctionalLocationPlant(clientAPI));
            promises.push(NotificationLibrary.ZNotificationCreateUpdateEquipmentPlant(clientAPI));
            promises.push(NotificationReferenceType(clientAPI));

            return Promise.all(promises).then(results => {
                ////The number of promises is different when phase model is on we need to re-arrange the order
                let notifNum = results[0];
                let workcenter = results[1];
                let qmcatalog = '';
                let floc = results[3];
                //let equip = '';
                let equip = results[4];
                let zflplant = results[5];
                let zeqplant = results[6];
                qmcatalog = results[2];
                floc = results[4];
                equip = results[5];


                let zmaintplant = '';
                if (zeqplant)
                    zmaintplant = zeqplant;
                else if (zflplant)
                    zmaintplant = zflplant;
                else
                    zmaintplant = GetPlanningPlant();

                let notificationCreateProperties = {
                    'PlanningPlant': zmaintplant,
                    'PlanningGroup': plannerGroup.length ? plannerGroup[0].ReturnValue : '',
                    //'PlanningPlant': NotificationLibrary.NotificationCreateDefaultPlant(clientAPI),
                    'NotificationNumber': notifNum,
                    'NotificationDescription': descr,
                    'NotificationType': type,
                    'Priority': NotificationLibrary.NotificationCreateUpdatePrioritySegValue(clientAPI),
                    'HeaderFunctionLocation': floc,
                    'HeaderEquipment': equip,
                    'BreakdownIndicator': BreakdownSwitchValue(clientAPI),
                    'MainWorkCenter': workcenter,
                    'MainWorkCenterPlant': NotificationLibrary.NotificationCreateMainWorkCenterPlant(clientAPI),
                    'ReportedBy': ComLib.getSapUserName(clientAPI),
                    'CreationDate': GetCurrentDate(clientAPI),
                    'ReferenceNumber': NotificationReferenceNumber(clientAPI),
                    'RefObjectKey': NotificationReferenceNumber(clientAPI),
                    'RefObjectType': results[6],
                };

                notificationCreateProperties.QMCodeGroup = NotificationCreateUpdateQMCodeGroupValue(clientAPI);
                notificationCreateProperties.QMCode = NotificationCreateUpdateQMCodeValue(clientAPI);
                notificationCreateProperties.QMCatalog = qmcatalog;

                if (breakdownStart) {
                    notificationCreateProperties.MalfunctionStartDate = GetMalfunctionStartDate(clientAPI);
                    notificationCreateProperties.MalfunctionStartTime = GetMalfunctionStartTime(clientAPI);
                }

                if (breakdownEnd) {
                    notificationCreateProperties.MalfunctionEndDate = GetMalfunctionEndDate(clientAPI);
                    notificationCreateProperties.MalfunctionEndTime = GetMalfunctionEndTime(clientAPI);
                }

                //Update property InspectionLot.
                if (clientAPI.binding && clientAPI.binding['@odata.type'] === '#sap_mobile.InspectionCharacteristic') {
                    notificationCreateProperties.InspectionLot = clientAPI.binding.InspectionLot;
                }

                if (ComLib.getStateVariable(clientAPI, 'isMinorWork') && IsEmergencyWorkEnabled(clientAPI)) {
                    const minorWorkValue = clientAPI.getGlobalDefinition('/SAPAssetManager/Globals/Notifications/MinorWork.global').getValue();
                    notificationCreateProperties.NotifProcessingContext = minorWorkValue;
                }

                return clientAPI.executeAction({
                    'Name': '/SAPAssetManager/Actions/Notifications/CreateUpdate/NotificationCreate.action',
                    'Properties': {
                        'Properties': notificationCreateProperties,
                        'Headers':
                        {
                            'OfflineOData.RemoveAfterUpload': 'true',
                            'OfflineOData.TransactionID': notifNum,
                        },
                    },
                }).then(actionResult => {
                    // Store created notification
                    ComLib.setStateVariable(clientAPI, 'CreateNotification', JSON.parse(actionResult.data));
                    // Start--Below condition added for notification creation for 13,14,15 orders as part of CR3.
                    if (clientAPI.binding.NotificationType != "Y1") {
                        return ZNotificationCreateSuccess(clientAPI, JSON.parse(actionResult.data));
                    } else {
                        return NotificationCreateSuccess(clientAPI, JSON.parse(actionResult.data));
                    }
                    //End
                }).catch(() => {
                    clientAPI.dismissActivityIndicator();
                    return clientAPI.executeAction('/SAPAssetManager/Actions/OData/ODataCreateFailureMessage.action');
                });
            }).catch(err => {
                Logger.error('Notification', err);
                clientAPI.dismissActivityIndicator();
                return clientAPI.executeAction('/SAPAssetManager/Actions/OData/ODataCreateFailureMessage.action');
            });

        } else {
            clientAPI.dismissActivityIndicator();
            Logger.error(clientAPI.getGlobalDefinition('/SAPAssetManager/Globals/Logs/CategoryNotifications.global').getValue(), 'One of the required controls did not return a value OnCreate');
            return clientAPI.executeAction('/SAPAssetManager/Actions/OData/ODataCreateFailureMessage.action');
        }
    } else {
        let promises = [];
        promises.push(NotificationCreateUpdateQMCatalog(clientAPI));
        promises.push(notifCategoryPromise);
        promises.push(NotificationLibrary.NotificationCreateMainWorkCenter(clientAPI));

        return Promise.all(promises).then(results => {
            let workcenter = results.length >= 2 ? results[2] : '';

            let notificationUpdateProperties = {
                'NotificationDescription': descr,
                'NotificationType': type,
                'Priority': NotificationLibrary.NotificationCreateUpdatePrioritySegValue(clientAPI),
                'HeaderFunctionLocation': NotificationLibrary.NotificationCreateUpdateFunctionalLocationLstPkrValue(clientAPI),
                'HeaderEquipment': NotificationLibrary.NotificationCreateUpdateEquipmentLstPkrValue(clientAPI),
                'BreakdownIndicator': BreakdownSwitchValue(clientAPI),
                'PlanningGroup': plannerGroup.length ? plannerGroup[0].ReturnValue : '',
                'MainWorkCenter': workcenter,
                'MainWorkCenterPlant': NotificationLibrary.NotificationCreateMainWorkCenterPlant(clientAPI),
            };

            if (breakdownStart) {
                notificationUpdateProperties.MalfunctionStartDate = GetMalfunctionStartDate(clientAPI);
                notificationUpdateProperties.MalfunctionStartTime = GetMalfunctionStartTime(clientAPI);
            }

            if (breakdownEnd) {
                notificationUpdateProperties.MalfunctionEndDate = GetMalfunctionEndDate(clientAPI);
                notificationUpdateProperties.MalfunctionEndTime = GetMalfunctionEndTime(clientAPI);
            }

            notificationUpdateProperties.QMCodeGroup = NotificationCreateUpdateQMCodeGroupValue(clientAPI);
            notificationUpdateProperties.QMCode = NotificationCreateUpdateQMCodeValue(clientAPI);
            notificationUpdateProperties.QMCatalog = results[0];
            return clientAPI.executeAction({
                'Name': '/SAPAssetManager/Actions/Notifications/CreateUpdate/NotificationUpdate.action',
                'Properties': {
                    'Properties': notificationUpdateProperties,
                    'OnSuccess': '',
                },
            }).then(() => {
                // eslint-disable-next-line brace-style
                const createItem = isControlPopulated('ItemDescription', formCellContainer) || [['PartGroupLstPkr', 'PartDetailsLstPkr'], ['DamageGroupLstPkr', 'DamageDetailsLstPkr']]
                    .some(([parentName, childName]) => isControlPopulated(parentName, formCellContainer) && isControlPopulated(childName, formCellContainer));
                if (createItem) {
                    return clientAPI.executeAction({
                        'Name': '/SAPAssetManager/Actions/Notifications/Item/NotificationItemCreate.action',
                        'Properties': {
                            'OnSuccess': '',
                        },
                    });
                } else {
                    return Promise.reject(); // Skip item and cause create
                }
            }).then(actionResult => {
                // eslint-disable-next-line brace-style
                const createCause = isControlPopulated('CauseDescription', formCellContainer) || ['CodeLstPkr', 'CauseGroupLstPkr'].every(pickerName => isControlPopulated(pickerName, formCellContainer));
                if (createCause) {
                    let data = JSON.parse(actionResult.data);
                    return clientAPI.executeAction({
                        'Name': '/SAPAssetManager/Actions/Notifications/Item/NotificationItemCauseCreate.action',
                        'Properties': {
                            'Properties':
                            {
                                'NotificationNumber': data.NotificationNumber,
                                'ItemNumber': data.ItemNumber,
                                'CauseSequenceNumber': '0001',
                                'CauseText': clientAPI.evaluateTargetPath('#Control:CauseDescription/#Value') || '',
                                // eslint-disable-next-line brace-style
                                'CauseCodeGroup': (function () { try { return clientAPI.evaluateTargetPath('#Control:CauseGroupLstPkr/#SelectedValue'); } catch (e) { return ''; } })(),
                                // eslint-disable-next-line brace-style
                                'CauseCode': (function () { try { return clientAPI.evaluateTargetPath('#Control:CodeLstPkr/#SelectedValue'); } catch (e) { return ''; } })(),
                                'CauseSortNumber': '0001',
                            },
                            'Headers':
                            {
                                'OfflineOData.RemoveAfterUpload': 'true',
                                'OfflineOData.TransactionID': data.NotificationNumber,
                            },
                            'CreateLinks':
                                [{
                                    'Property': 'Item',
                                    'Target':
                                    {
                                        'EntitySet': 'MyNotificationItems',
                                        'ReadLink': data['@odata.readLink'],
                                    },
                                }],
                            'OnSuccess': '',
                        },
                    });
                } else {
                    return Promise.reject(); // Skip cause create
                }
            }).catch(() => {
                return Promise.resolve(); // Continue action chain
            }).then(() => {
                return NotificationUpdateSuccess(clientAPI);
            });
        }).catch(() => {
            clientAPI.dismissActivityIndicator();
            return clientAPI.executeAction('/SAPAssetManager/Actions/CreateUpdateDelete/UpdateEntityFailureMessage.action');
        });
    }
}
