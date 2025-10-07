import libCommon from '../../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function ActivityDetailsNav(context) {

    return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + context.binding.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(results2 => {
        if (results2.getItem.length > 0 && results2.getItem(0).Activities.length > 0) {
            let queryOption = '$expand=DisconnectActivityType_Nav,DisconnectActivityStatus_Nav,WOHeader_Nav/OrderMobileStatus_Nav,WOHeader_Nav/OrderISULinks';
             return libCommon.navigateOnRead(context.getPageProxy(), '/SAPAssetManager/Actions/WorkOrders/Meter/Activity/ActivityDetailsNav.action', context.getPageProxy().binding.DisconnectActivity_Nav[0]['@odata.readLink'], queryOption);
        } else {
             return context.executeAction('/ZSAPAssetManager/Actions/WorkOrders/MobileStatus/ZWorkOrderDisconnectActivityCheck.action');
        }
    });

}
