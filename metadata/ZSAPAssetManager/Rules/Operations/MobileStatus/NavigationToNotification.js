
import cleanClientData from '../../../../SAPAssetManager/Rules/Classification/Characteristics/CharacteristicCleanUp'
import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function NavigationToNotification(pageProxy) {
   return pageProxy.read('/SAPAssetManager/Services/AssetManager.service', 'MyNotificationHeaders', [], "$filter=NotificationNumber eq '" + pageProxy.binding.WOHeader.NotificationNumber + "'&$expand=Activities,Items/ItemActivities").then(result => {
        pageProxy.setActionBinding(result.getItem(0));
        return pageProxy.executeAction('/ZSAPAssetManager/Actions/Notifications/NotificationDetailsCC.action');
    })
}


