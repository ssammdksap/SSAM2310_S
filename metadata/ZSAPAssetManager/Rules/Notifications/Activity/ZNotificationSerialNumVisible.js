
import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function ZNotificationSerialNum(context) {
    let NotifType = context.binding.NotificationType; // return like 13 or 14
    let NewType = String(NotifType).padStart(4, '0'); // made number as 0013 or 0014 to check below condition
    let SerialNumTypes = "0013,0014,0015";
    let OrderIdParam = common.getAppParam(context, 'ZSERIALNUMENABLE', 'MeterOrderTypes');
    if (OrderIdParam) {
        SerialNumTypes = OrderIdParam;
    }
    let OrderIdParamTypesA = SerialNumTypes.split(",");
    if (NewType == OrderIdParamTypesA) {
        return true;
    }
    else {
        return false;
    }


    // return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + OrderId + "'").then(order => {
    //     if (order.getItem.length > 0) {
    //         if (order.getItem(0).OrderType == OrderIdParamTypesA) {
    //             return true;
    //         }
    //         else{
    //             return false;
    //         }
    //     }else{
    //     	return true;
    //     }
    // });
}
