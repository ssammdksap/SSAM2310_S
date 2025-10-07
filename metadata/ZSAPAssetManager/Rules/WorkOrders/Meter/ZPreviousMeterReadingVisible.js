import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function DetailsCaptionFix(context) {

    let OrderId = context.getPageProxy().binding.OrderNum;
    let OrderIdParam =  common.getAppParam(context, 'ZINSPECTIONORDERTYPES', 'InspectionOrders');
    let OrderIdParamTypesA = OrderIdParam.split(",");

    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + OrderId + "'").then(order => {
        if (order.getItem.length > 0) {
            if (order.getItem(0).OrderType == OrderIdParamTypesA) {
                return true;
            }
            else{
                return false;
            }
        }
        return true;
    });
   
}