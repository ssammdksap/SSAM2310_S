import IsWONotificationVisible from '../../../../SAPAssetManager/Rules/WorkOrders/Complete/Notification/IsWONotificationVisible';
import WorkOrderCompletionLibrary from '../../../../SAPAssetManager/Rules/WorkOrders/Complete/WorkOrderCompletionLibrary';
import libCommon from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import {ChecklistLibrary as libChecklist} from '../../../../SAPAssetManager/Rules/Checklists/ChecklistLibrary';
import {ActivityCodeAndAttachmentsCheck as ZCustomCheck} from '../../Operations/MobileStatus/ZActivityCodeAndAttachmentsCheck'

export default function NavOnCompleteOperationPage(context, actionBinding) {
    let binding = actionBinding || libCommon.getBindingObject(context) || context.getActionBinding();

    const equipment = binding.OperationEquipment;
    const functionalLocation = binding.OperationFunctionLocation;

    let expandOperationAction = Promise.resolve();
    if (binding && binding['@odata.type'] === '#sap_mobile.MyWorkOrderOperation' && !binding.WOHeader) {
        expandOperationAction = context.read('/SAPAssetManager/Services/AssetManager.service', binding['@odata.editLink'], [], '$expand=WOHeader');
    }

    return expandOperationAction.then(function (result) {
        if (result && result.length > 0) {
            binding.WOHeader = result.getItem(0).WOHeader;
        }
        //Check for non-complete checklists and ask for confirmation    
        return libChecklist.allowWorkOrderComplete(context, equipment, functionalLocation).then(async results => {
            if (results === true) {
                WorkOrderCompletionLibrary.getInstance().setCompletionFlow('operation');
                await WorkOrderCompletionLibrary.getInstance().initSteps(context);
                WorkOrderCompletionLibrary.getInstance().setBinding(context, binding);

                return IsWONotificationVisible(context, binding.WOHeader, 'Notification').then((notification) => {
                    if (notification) {
                        WorkOrderCompletionLibrary.updateStepState(context, 'notification', {
                            visible: true,
                            data: JSON.stringify(notification),
                            link: notification['@odata.editLink'],
                            initialData: JSON.stringify(notification),
                        });
                    } else {
                        WorkOrderCompletionLibrary.updateStepState(context, 'notification', {
                            visible: false,
                        });
                    }

                    //WorkOrderCompletionLibrary.getInstance().setCompleteFlag(context, true);
                    //return WorkOrderCompletionLibrary.getInstance().openMainPage(context, false);
                    //Start -- Below code aded for checking Activity code and Attachements for CS orders
                    return ZCustomCheck.CheckDisconnectionCC(context).then(result => {
                        if (result) {
                            return ZCustomCheck.CheckUtilityAttachments(context).then(result2 => {
                                if (result2) {
                                	WorkOrderCompletionLibrary.getInstance().setCompleteFlag(context, true);
                                    return WorkOrderCompletionLibrary.getInstance().openMainPage(context, false);
                                }
                                else {
                                    return context.executeAction('/ZSAPAssetManager/Actions/WorkOrders/MobileStatus/OperationMobileStatusAttachmentRequired.action');
                                }
                            });

                        }
                        else {
                            return context.executeAction('/ZSAPAssetManager/Actions/WorkOrders/MobileStatus/OperationMobileStatusFailureMessageCustom.action');
                        }

                    });
                    //End
                });
            }
            return Promise.resolve();
        });
    });
    
}

