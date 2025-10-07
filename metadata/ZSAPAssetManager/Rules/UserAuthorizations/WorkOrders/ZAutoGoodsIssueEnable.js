/**
* New Requirement to enable auto goods issue for all CS orders that are configured in Config panel. 
*
*/
import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function ZEnableMIGO(context) {
    let migoAllowedTypes  =  common.getAppParam(context, 'ZAUTOGOODSISSUEENABLE', 'CSOrderTypes');
    let migoAllowedTypesA = migoAllowedTypes.split(","); 

    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + context.binding.OrderId + "'").then(order => {
        if (order.getItem.length > 0) {
            if (migoAllowedTypesA.includes(order.getItem(0).OrderType)) {
                return "X"
            }
            else{
                return " "
            }
        }
        return
    });
}