import userFeaturesLib from '../../../SAPAssetManager/Rules/UserFeatures/UserFeaturesLibrary';
import libCommon from '../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import libMeter from '../../../SAPAssetManager/Rules/Meter/Common/MeterLibrary';

export default function IsDiscardButtonVisible(context) {
    let pageName = libCommon.getPageName(context);
    // UAT Defect - Discard button not coming on Edit Notification Activity
    /*if (userFeaturesLib.isFeatureEnabled(context, context.getGlobalDefinition('/SAPAssetManager/Globals/Features/Meter.global').getValue())) {
        if (libMeter.isProcessed(context.getPageProxy().binding)) {
            if (context.binding['@sap.isLocal']) {
                return Promise.resolve(true);
            } else {
                return context.read('/SAPAssetManager/Services/AssetManager.service', context.binding['@odata.readLink'] + '/Device_Nav', [], '').then(function(result) {
                    if (result && result.length > 0) {
                        let entity = result.getItem(0);
                        return Boolean(entity['@sap.isLocal']);
                    } else {
                        return false;
                    }
                });
            }
        } else {
            return false;
        }
    }*/
    if (libCommon.IsOnCreate(context)) {
        return false;
    } else {
        let currentReadLink = context.binding['@odata.readLink'];
        if (context.binding['@odata.type'] !== '#sap_mobile.MyNotificationItem') {
            if (context.binding['@odata.type'] === '#sap_mobile.MyWorkOrderOperation') {
                return context.count('/SAPAssetManager/Services/AssetManager.service', `${currentReadLink}/WOHeader/Operations`, '').then(function(count) {
                    return (count > 1) && libCommon.isCurrentReadLinkLocal(currentReadLink);
                });
            } else if (context.binding['@odata.type'] === '#sap_mobile.InboundDeliveryItem' || context.binding['@odata.type'] === '#sap_mobile.OutboundDeliveryItem') {
                if (Object.prototype.hasOwnProperty.call(context.binding,'@sap.isLocal') && context.binding['@sap.isLocal'] && Object.prototype.hasOwnProperty.call(context.binding,'@sap.hasPendingChanges') && context.binding['@sap.hasPendingChanges']) {
                    return true;
                }
                return false;
            } else {
                if ((libCommon.isCurrentReadLinkLocal(currentReadLink)) && (pageName === 'WorkOrderTransfer')) {
                    return false;
                }
                return libCommon.isCurrentReadLinkLocal(currentReadLink);
            }
        } else {
            return context.read('/SAPAssetManager/Services/AssetManager.service', currentReadLink, [], '$expand=ItemActivities,ItemCauses,ItemTasks').then(function(result) {
                if (result) {
                    result = result.getItem(0);

                    // Check if any Item Causes are synced (non-local)
                    for (let i in result.ItemCauses) {
                        if (!libCommon.isCurrentReadLinkLocal(result.ItemCauses[i]['@odata.readLink'])) {
                            return false;
                        }
                    }

                    // Check if any Item Tasks are synced (non-local)
                    for (let i in result.ItemTasks) {
                        if (!libCommon.isCurrentReadLinkLocal(result.ItemTasks[i]['@odata.readLink'])) {
                            return false;
                        }
                    }

                    // Check if any Item Tasks are synced (non-local)
                    for (let i in result.ItemActivities) {
                        if (!libCommon.isCurrentReadLinkLocal(result.ItemActivities[i]['@odata.readLink'])) {
                            return false;
                        }
                    }
                }
                // Deletion is permitted
                return libCommon.isCurrentReadLinkLocal(currentReadLink);
            });
        }
    }

    // Moved this if condition from top to bottom as it was always returning false. Hence Discard button not appearning on Edit Notification Activity
    // libMeter.isProcessed will always return false because Notification Activity page context don't have ISUProcess & DisconnectActivity_Nav
    if (userFeaturesLib.isFeatureEnabled(context, context.getGlobalDefinition('/SAPAssetManager/Globals/Features/Meter.global').getValue())) {
        if (libMeter.isProcessed(context.getPageProxy().binding)) {
            if (context.binding['@sap.isLocal']) {
                return Promise.resolve(true);
            } else {
                return context.read('/SAPAssetManager/Services/AssetManager.service', context.binding['@odata.readLink'] + '/Device_Nav', [], '').then(function(result) {
                    if (result && result.length > 0) {
                        let entity = result.getItem(0);
                        return Boolean(entity['@sap.isLocal']);
                    } else {
                        return false;
                    }
                });
            }
        } else {
            return false;
        }
    }
}
