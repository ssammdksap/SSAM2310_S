// UAT Defect - Enable Add Activity on Work Order Details Page when Notification is present

export default function ZIsNotificationAvailable(context) {
    let readLink = context.binding['@odata.type'] + '/Notification';
    if (readLink)
        return true;
    else
        return false;
}