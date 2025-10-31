/**
* Defect 8000003772 - Goods Issue / Goods Return to be enable for specific Order Types of NCP. 
* EAM don't require Goods Issue / Goods Return from mobile.
*/
import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function ZEnableMIGO(context) {
    const migoAllowedTypes = common.getAppParam(context, 'ZMIGO', 'OrderTypeEnable');
    let migoAllowedTypesA = migoAllowedTypes.split(",");

    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + context.binding.OrderId + "'").then(order => {
        if (order.getItem.length > 0) {
            if (migoAllowedTypesA.includes(order.getItem(0).OrderType)) {
                return Promise.resolve(true);
            }
            else{
                return Promise.resolve(false);
            }
        }
        return
    });
}