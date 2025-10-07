import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

// Hide fields for Edit Notifications
// Non Editable for Edit Notification Scenatio
export default function ZNotificationCreateUpdateFieldVisibility(context) {
    var onCreate = common.IsOnCreate(context);

    return onCreate;
}