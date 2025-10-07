import libCommon from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function NotificationActivityCreateNav(context) {
    libCommon.setOnCreateUpdateFlag(context, 'CREATE');
    context.executeAction('/ZSAPAssetManager/Actions/Notifications/Activity/ZNotificationActivityCreateUpdateNav.action');
}

