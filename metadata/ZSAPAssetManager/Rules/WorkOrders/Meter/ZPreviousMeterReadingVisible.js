import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function DetailsCaptionFix(context) {

    let OrderId = common.getStateVariable(context, 'ZOrderIDMeter');
    let OrderIdParam = common.getAppParam(context, 'ZINSPECTIONORDERTYPES', 'InspectionOrders');
    let OrderIdParamTypesA = OrderIdParam.split(",");

    if (OrderIdParam) {
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + OrderId + "'").then(order => {
            if (order.getItem.length > 0) {
                if (OrderIdParamTypesA.includes(order.getItem(0).OrderType)) {
                    return true;
                }
                else {
                    return false;
                }
            }
            return true;
        });

    } else {
        return true;
    }



}