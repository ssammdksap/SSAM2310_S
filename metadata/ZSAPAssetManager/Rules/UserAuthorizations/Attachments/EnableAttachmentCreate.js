/**
* Show/Hide Attachment create/edit based on user authorization
* @param {IClientAPI} context
*/
import DocLib from '../../../../SAPAssetManager/Rules/Documents/DocumentLibrary';
import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import { WorkOrderLibrary as libWo } from '../../../../SAPAssetManager/Rules/WorkOrders/WorkOrderLibrary';

import libPersona from '../../../../SAPAssetManager/Rules/Persona/PersonaLibrary';
import DocumentsIsVisible from '../../../../SAPAssetManager/Rules/Documents/DocumentsIsVisible';

export default function EnableAttachmentCreate(context) {
    if (libPersona.isWCMOperator(context) || !DocumentsIsVisible(context)) {
        return false;
    }

    switch (DocLib.getParentObjectType(context)) {
        case DocLib.ParentObjectType.Equipment:
            return (libCom.getAppParam(context, 'USER_AUTHORIZATIONS', 'Enable.EQ.Attach') === 'Y');
        case DocLib.ParentObjectType.FunctionalLocation:
            return (libCom.getAppParam(context, 'USER_AUTHORIZATIONS', 'Enable.FL.Attach') === 'Y');
        case DocLib.ParentObjectType.WorkOrder:
        case DocLib.ParentObjectType.Operation:
            return libWo.isServiceOrder(context).then(isSrvOrd => {
                return !isSrvOrd;
            });
        case DocLib.ParentObjectType.SubOperation:
            return !libWo.isWorkOrderInCreatedState(context);
        default:
            return true;
    }

}
