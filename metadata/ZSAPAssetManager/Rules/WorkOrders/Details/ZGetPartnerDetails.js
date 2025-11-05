/**
* Describe this function...
* @param {IClientAPI} clientAPI
*/

import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
// export default function ZGetPartnerDetails(context, Value) {

export default async function ZGetPartnerDetails(context, Value) {
    let AddressNum = Value;
    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderPartners', [], "$filter=AddressNum eq '" + AddressNum + "'").then(order => {
        if (order.getItem.length > 0) {
            libCom.setStateVariable(context, 'ZBusinessPartner', order.getItem(0).Partner);
            return true;
        }else{
            libCom.setStateVariable(context, 'ZBusinessPartner', "");
        }
    });
}