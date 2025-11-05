import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
/* Added Import of Meter Library to check the Meter is  processed or not*/
import meterLib from '../../../../SAPAssetManager/Rules/Meter/Common/MeterLibrary';
/**
 * Check the Disconnection CC for exception PP list for GAP181
 * @param {*} caption 
 * @returns 
 */

export class ActivityCodeAndAttachmentsCheck {

    static CheckDisconnectionCC(context) {
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

    static CheckUtilityAttachments(context) {
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
    
    //Check for Serial number add for CS orders
    static CheckUtilitySerialNumber(context) {
        const SerialAllowedTypes = common.getAppParam(context, 'ZSERIALNUMENABLE', 'MeterOrderTypes');
        let SerialNumberCode = "MTERSERL"
        let SerialNumOrders = "0013,0014,0015"
        let SerialNumberCodeParam = common.getAppParam(context, 'ZEXCEPTIONS', 'MeterInsatallActType');
        if(SerialNumberCodeParam){
        	SerialNumberCode = SerialNumberCodeParam;
        }
        if(SerialAllowedTypes){
            SerialNumOrders = SerialAllowedTypes
        }

        let SerialAllowedTypesA = SerialNumOrders.split(",");
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + context.binding.OrderId + "'").then(order => {
            if (order.getItem.length > 0) {
                if (SerialAllowedTypesA.includes(order.getItem(0).OrderType)) {
                	
                	 return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
                            if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
                                let excpCount = results2.getItem(0).Activities.filter(activity => activity.ActivityCodeGroup === SerialNumberCode).length;
                                let actCount = results2.getItem(0).Activities.length;
                                let returnActivity = (results2.getItem(0).Activities.some(activity => activity.ActivityCodeGroup === SerialNumberCode)) && !(excpCount == actCount);
                                return Promise.resolve(!returnActivity);
                            } else {
                                return Promise.resolve(false);
                            }
                        })
                	
                        }
                else {
                    return Promise.resolve(true);
                }
            }
            return Promise.resolve(true);
        });


    }


}